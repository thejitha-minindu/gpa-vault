import { supabase } from '../lib/supabase';

const serializeProfile = ({ dark, scaleName, priorGPA, priorCreds, userId }) => ({
  id: userId,
  theme: dark ? 'dark' : 'light',
  scale_name: scaleName,
  prior_gpa: priorGPA === '' ? null : Number(priorGPA),
  prior_credits: priorCreds === '' ? null : Number(priorCreds),
  updated_at: new Date().toISOString(),
});

export const loadUserDataFromSupabase = async userId => {
  const [{ data: profileData }, { data: semesterRows }, { data: courseRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('semester_records').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
    supabase.from('course_records').select('*').eq('user_id', userId).order('semester_id', { ascending: true }).order('order_index', { ascending: true }),
  ]);

  const profile = profileData && typeof profileData === 'object' ? profileData : {};

  const semesters = (semesterRows ?? []).map(row => ({
    id: row.local_id,
    name: row.name,
    weight: Number(row.weight ?? 1),
    courses: (courseRows ?? [])
      .filter(course => course.semester_id === row.id)
      .sort((a, b) => Number(a.order_index) - Number(b.order_index))
      .map(course => ({
        id: course.local_id,
        name: course.name,
        credits: Number(course.credits),
        grade: course.grade,
      })),
  }));

  return {
    semesters,
    dark: profile.theme ? profile.theme === 'dark' : true,
    scaleName: profile.scale_name || '4.2 Standard',
    priorGPA: profile.prior_gpa ?? '',
    priorCreds: profile.prior_credits ?? '',
  };
};

export const saveUserDataToSupabase = async (userId, { semesters, dark, scaleName, priorGPA, priorCreds }) => {
  const profileResult = await supabase.from('profiles').upsert(serializeProfile({ dark, scaleName, priorGPA, priorCreds, userId }), { onConflict: 'id' });
  if (profileResult.error) {
    throw profileResult.error;
  }

  const courseDeleteResult = await supabase.from('course_records').delete().eq('user_id', userId);
  if (courseDeleteResult.error) {
    throw courseDeleteResult.error;
  }

  const semesterDeleteResult = await supabase.from('semester_records').delete().eq('user_id', userId);
  if (semesterDeleteResult.error) {
    throw semesterDeleteResult.error;
  }

  const semesterRows = semesters.map((semester, index) => ({
    user_id: userId,
    local_id: semester.id,
    name: semester.name,
    weight: Number(semester.weight ?? 1),
    order_index: index,
    updated_at: new Date().toISOString(),
  }));

  const semesterInsertResult = await supabase.from('semester_records').insert(semesterRows).select('id, local_id');
  if (semesterInsertResult.error) {
    throw semesterInsertResult.error;
  }

  const savedSemesters = semesterInsertResult.data ?? [];
  const semesterMap = new Map(savedSemesters.map(row => [row.local_id, row.id]));

  const courseRows = semesters.flatMap((semester) =>
    (semester.courses ?? []).map((course, courseIndex) => {
      const semesterId = semesterMap.get(semester.id);
      if (semesterId == null) {
        throw new Error(`Failed to map semester ${semester.id} to a persisted database row`);
      }

      return {
        user_id: userId,
        local_id: course.id,
        semester_id: semesterId,
        name: course.name,
        credits: Number(course.credits),
        grade: course.grade,
        order_index: courseIndex,
        updated_at: new Date().toISOString(),
      };
    })
  );

  if (courseRows.length > 0) {
    const courseInsertResult = await supabase.from('course_records').insert(courseRows);
    if (courseInsertResult.error) {
      throw courseInsertResult.error;
    }
  }

  return { savedSemesters, courseRows };
};
