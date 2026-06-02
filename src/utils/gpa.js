export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 11)}`);

export const normalizeSemesters = (value, fallbackGrade = 'A') => {
  if (!Array.isArray(value)) return [];

  return value.map((semester, semesterIndex) => ({
    id: semester?.id || uid(),
    name: typeof semester?.name === 'string' && semester.name.trim() ? semester.name : `Semester ${semesterIndex + 1}`,
    weight: Number(semester?.weight) > 0 ? Number(semester.weight) : 1,
    courses: Array.isArray(semester?.courses)
      ? semester.courses.map(course => ({
        id: course?.id || uid(),
        name: typeof course?.name === 'string' ? course.name : '',
        credits: Number(course?.credits) > 0 ? course.credits : 3,
        grade: typeof course?.grade === 'string' ? course.grade : fallbackGrade,
      }))
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
  const pts = scale.points;
  const valid = courses.filter(c => c.grade in pts && Number(c.credits) > 0);
  if (!valid.length) return null;
  const totalPoints = valid.reduce((sum, c) => sum + pts[c.grade] * Number(c.credits), 0);
  const totalCredits = valid.reduce((sum, c) => sum + Number(c.credits), 0);
  return totalCredits > 0 ? totalPoints / totalCredits : null;
};

export const semCreds = (semester, points) =>
  semester.courses.filter(c => c.grade in points && Number(c.credits) > 0).reduce((sum, c) => sum + Number(c.credits), 0);
