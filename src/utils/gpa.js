export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 11)}`);

export const PENDING_GRADE = 'Result Pending';
export const NON_GPA_GRADE = 'Pass (Non-GPA)';

export const isPendingGrade = grade => {
  if (!grade || typeof grade !== 'string') return false;
  const normalized = grade.trim().toLowerCase();
  return (
    normalized === 'result pending' ||
    normalized === 'pending' ||
    normalized === 'in progress' ||
    normalized === 'awaiting result' ||
    normalized === 'result awaited' ||
    normalized === 'ip' ||
    normalized === 'pr'
  );
};

export const isNonGpaGrade = grade => {
  if (!grade || typeof grade !== 'string') return false;
  const normalized = grade.trim().toLowerCase();
  return (
    normalized.includes('non-gpa') ||
    normalized.includes('non gpa') ||
    normalized.includes('ngpa') ||
    normalized === 'pass' ||
    normalized === 'p' ||
    normalized === 'satisfactory' ||
    normalized === 's' ||
    normalized === 'audit' ||
    normalized === 'au'
  );
};

export const isNonGpaCourse = course => {
  if (!course) return false;
  return Boolean(course.isNonGpa || course.nonGpa || isNonGpaGrade(course.grade));
};

export const normalizeSemesters = (value, fallbackGrade = 'A') => {
  if (!Array.isArray(value)) return [];

  return value.map((semester, semesterIndex) => ({
    id: semester?.id || uid(),
    name: typeof semester?.name === 'string' && semester.name.trim() ? semester.name : `Semester ${semesterIndex + 1}`,
    weight: Number(semester?.weight) > 0 ? Number(semester.weight) : 1,
    courses: Array.isArray(semester?.courses)
      ? semester.courses.map(course => {
        const hasTag = typeof course?.grade === 'string' && course.grade.includes('(Non-GPA)');
        const isNonGpa = Boolean(course?.isNonGpa || course?.nonGpa || hasTag || isNonGpaGrade(course?.grade));
        const cleanGrade = hasTag ? course.grade.replace('(Non-GPA)', '').trim() : course?.grade;
        return {
          id: course?.id || uid(),
          name: typeof course?.name === 'string' ? course.name : '',
          credits: Number(course?.credits) > 0 ? course.credits : 3,
          grade: typeof cleanGrade === 'string' ? cleanGrade : fallbackGrade,
          isNonGpa,
        };
      })
      : [],
  }));
};

export const fmt = g => (g != null ? g.toFixed(2) : "—");

export const gColDyn = (g, max) => {
  if (g === null || g === undefined || Number.isNaN(g)) return "#6b7280";
  const r = g / max;
  if (r >= 0.875) return "#34d399";
  if (r >= 0.675) return "#fbbf24";
  if (r >= 0.5) return "#fb923c";
  return "#f87171";
};

export const calcGPA = (courses, scale) => {
  const pts = scale?.points || {};
  const valid = (courses || []).filter(
    c => !isNonGpaCourse(c) && !isPendingGrade(c.grade) && c.grade in pts && Number(c.credits) > 0
  );
  if (!valid.length) return null;
  const totalPoints = valid.reduce((sum, c) => sum + pts[c.grade] * Number(c.credits), 0);
  const totalCredits = valid.reduce((sum, c) => sum + Number(c.credits), 0);
  return totalCredits > 0 ? totalPoints / totalCredits : null;
};

export const semCreds = (semester, points) =>
  (semester?.courses || [])
    .filter(c => !isNonGpaCourse(c) && !isPendingGrade(c.grade) && c.grade in (points || {}) && Number(c.credits) > 0)
    .reduce((sum, c) => sum + Number(c.credits), 0);

export const semPendingCreds = semester =>
  (semester?.courses || [])
    .filter(c => !isNonGpaCourse(c) && isPendingGrade(c.grade) && Number(c.credits) > 0)
    .reduce((sum, c) => sum + Number(c.credits), 0);

export const semNonGpaCreds = semester =>
  (semester?.courses || [])
    .filter(c => isNonGpaCourse(c) && Number(c.credits) > 0)
    .reduce((sum, c) => sum + Number(c.credits), 0);

export const semTotalCreds = semester =>
  (semester?.courses || [])
    .filter(c => Number(c.credits) > 0)
    .reduce((sum, c) => sum + Number(c.credits), 0);
