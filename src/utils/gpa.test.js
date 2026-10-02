import { describe, expect, it } from 'vitest';
import {
  calcGPA,
  fmt,
  gColDyn,
  isNonGpaCourse,
  isNonGpaGrade,
  isPendingGrade,
  NON_GPA_GRADE,
  normalizeSemesters,
  PENDING_GRADE,
  semCreds,
  semNonGpaCreds,
  semPendingCreds,
  semTotalCreds,
  uid,
} from './gpa';

// ── Scale fixtures ───────────────────────────────────────────────────────────
const SCALE_4_0 = {
  max: 4.0,
  grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
  points: { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0 },
};

const SCALE_4_2 = {
  max: 4.2,
  grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'I', 'F'],
  points: { 'A+': 4.2, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.5, 'D': 1.0, 'I': 0, 'F': 0.0 },
};

// ── uid ──────────────────────────────────────────────────────────────────────
describe('uid', () => {
  it('returns a string', () => {
    expect(typeof uid()).toBe('string');
  });

  it('returns unique values on consecutive calls', () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
  });
});

// ── fmt ──────────────────────────────────────────────────────────────────────
describe('fmt', () => {
  it('returns "—" for null', () => {
    expect(fmt(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(fmt(undefined)).toBe('—');
  });

  it('formats to 2 decimal places', () => {
    expect(fmt(3.4567)).toBe('3.46');
  });

  it('pads whole numbers', () => {
    expect(fmt(4)).toBe('4.00');
  });

  it('handles zero', () => {
    expect(fmt(0)).toBe('0.00');
  });
});

// ── gColDyn ──────────────────────────────────────────────────────────────────
describe('gColDyn', () => {
  it('returns gray for null', () => {
    expect(gColDyn(null, 4.0)).toBe('#6b7280');
  });

  it('returns gray for undefined', () => {
    expect(gColDyn(undefined, 4.0)).toBe('#6b7280');
  });

  it('returns gray for NaN', () => {
    expect(gColDyn(NaN, 4.0)).toBe('#6b7280');
  });

  it('returns green for high GPA (≥87.5%)', () => {
    expect(gColDyn(4.0, 4.0)).toBe('#34d399');  // 100%
    expect(gColDyn(3.5, 4.0)).toBe('#34d399');  // 87.5%
  });

  it('returns yellow for good GPA (≥67.5%)', () => {
    expect(gColDyn(3.0, 4.0)).toBe('#fbbf24');  // 75%
    expect(gColDyn(2.7, 4.0)).toBe('#fbbf24');  // 67.5%
  });

  it('returns orange for passing GPA (≥50%)', () => {
    expect(gColDyn(2.0, 4.0)).toBe('#fb923c');  // 50%
    expect(gColDyn(2.6, 4.0)).toBe('#fb923c');  // 65%
  });

  it('returns red for low GPA (<50%)', () => {
    expect(gColDyn(1.0, 4.0)).toBe('#f87171');  // 25%
    expect(gColDyn(0, 4.0)).toBe('#f87171');     // 0%
  });
});

// ── PENDING_GRADE & isPendingGrade ───────────────────────────────────────────
describe('PENDING_GRADE and isPendingGrade', () => {
  it('defines PENDING_GRADE constant', () => {
    expect(PENDING_GRADE).toBe('Result Pending');
  });

  it('identifies standard pending aliases', () => {
    expect(isPendingGrade('Result Pending')).toBe(true);
    expect(isPendingGrade('result pending')).toBe(true);
    expect(isPendingGrade('Pending')).toBe(true);
    expect(isPendingGrade('pending')).toBe(true);
    expect(isPendingGrade('In Progress')).toBe(true);
    expect(isPendingGrade('in progress')).toBe(true);
    expect(isPendingGrade('Awaiting Result')).toBe(true);
    expect(isPendingGrade('Result Awaited')).toBe(true);
    expect(isPendingGrade('IP')).toBe(true);
    expect(isPendingGrade('PR')).toBe(true);
    expect(isPendingGrade('  Result Pending  ')).toBe(true);
  });

  it('returns false for graded entries and invalid inputs', () => {
    expect(isPendingGrade('A+')).toBe(false);
    expect(isPendingGrade('A')).toBe(false);
    expect(isPendingGrade('B')).toBe(false);
    expect(isPendingGrade('F')).toBe(false);
    expect(isPendingGrade('I')).toBe(false);
    expect(isPendingGrade('')).toBe(false);
    expect(isPendingGrade(null)).toBe(false);
    expect(isPendingGrade(undefined)).toBe(false);
    expect(isPendingGrade(123)).toBe(false);
  });
});

// ── NON_GPA_GRADE, isNonGpaGrade, isNonGpaCourse ────────────────────────────
describe('Non-GPA helpers', () => {
  it('defines NON_GPA_GRADE constant', () => {
    expect(NON_GPA_GRADE).toBe('Pass (Non-GPA)');
  });

  it('identifies non-GPA grade strings', () => {
    expect(isNonGpaGrade('Pass (Non-GPA)')).toBe(true);
    expect(isNonGpaGrade('Non-GPA')).toBe(true);
    expect(isNonGpaGrade('non-gpa')).toBe(true);
    expect(isNonGpaGrade('NGPA')).toBe(true);
    expect(isNonGpaGrade('Pass')).toBe(true);
    expect(isNonGpaGrade('pass')).toBe(true);
    expect(isNonGpaGrade('P')).toBe(true);
    expect(isNonGpaGrade('Satisfactory')).toBe(true);
    expect(isNonGpaGrade('S')).toBe(true);
    expect(isNonGpaGrade('Audit')).toBe(true);
  });

  it('returns false for standard GPA grades', () => {
    expect(isNonGpaGrade('A+')).toBe(false);
    expect(isNonGpaGrade('A')).toBe(false);
    expect(isNonGpaGrade('B')).toBe(false);
    expect(isNonGpaGrade('F')).toBe(false);
  });

  it('identifies non-GPA courses by flag or grade', () => {
    expect(isNonGpaCourse({ isNonGpa: true, grade: 'A' })).toBe(true);
    expect(isNonGpaCourse({ nonGpa: true, grade: 'B' })).toBe(true);
    expect(isNonGpaCourse({ grade: 'Pass (Non-GPA)' })).toBe(true);
    expect(isNonGpaCourse({ grade: 'Pass' })).toBe(true);
    expect(isNonGpaCourse({ isNonGpa: false, grade: 'A' })).toBe(false);
    expect(isNonGpaCourse(null)).toBe(false);
  });
});

// ── calcGPA ──────────────────────────────────────────────────────────────────
describe('calcGPA', () => {
  it('returns null for empty courses', () => {
    expect(calcGPA([], SCALE_4_0)).toBeNull();
  });

  it('returns null when no course has a valid grade', () => {
    const courses = [{ name: 'X', credits: 3, grade: 'Z' }];
    expect(calcGPA(courses, SCALE_4_0)).toBeNull();
  });

  it('returns null when all courses have pending results', () => {
    const courses = [
      { name: 'CS101', credits: 3, grade: PENDING_GRADE },
      { name: 'MA101', credits: 4, grade: 'Pending' },
      { name: 'PH101', credits: 3, grade: 'In Progress' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBeNull();
  });

  it('returns null when all courses are non-GPA modules', () => {
    const courses = [
      { name: 'Internship', credits: 4, isNonGpa: true, grade: 'A' },
      { name: 'Social Work', credits: 2, isNonGpa: true, grade: 'Pass' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBeNull();
  });

  it('computes single graded course correctly', () => {
    const courses = [{ name: 'Math', credits: 3, grade: 'A' }];
    expect(calcGPA(courses, SCALE_4_0)).toBe(4.0);
  });

  it('computes weighted average of multiple courses', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'A' },   // 4.0 * 3 = 12
      { name: 'English', credits: 3, grade: 'B' }, // 3.0 * 3 = 9
    ];
    // (12 + 9) / 6 = 3.5
    expect(calcGPA(courses, SCALE_4_0)).toBe(3.5);
  });

  it('completely excludes pending courses from GPA calculation', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'A' },               // 4.0 * 3 = 12
      { name: 'English', credits: 3, grade: 'B' },            // 3.0 * 3 = 9
      { name: 'Physics', credits: 4, grade: PENDING_GRADE },  // ignored!
      { name: 'Chemistry', credits: 3, grade: 'Pending' },    // ignored!
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBe(3.5);
  });

  it('completely excludes non-GPA modules from GPA calculation', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'A' },                        // 4.0 * 3 = 12
      { name: 'English', credits: 3, grade: 'B' },                     // 3.0 * 3 = 9
      { name: 'Industrial Training', credits: 6, isNonGpa: true, grade: 'A+' }, // Non-GPA: ignored!
      { name: 'Community Ethics', credits: 2, grade: 'Pass (Non-GPA)' },        // Non-GPA: ignored!
    ];
    // Only Math and English count: (12 + 9) / 6 = 3.50
    // Neither the 6-credit training nor the ethics course alter the GPA.
    expect(calcGPA(courses, SCALE_4_0)).toBe(3.5);
  });

  it('returns null when all courses in a semester are non-GPA', () => {
    const courses = [
      { name: 'Internship', credits: 6, isNonGpa: true, grade: 'Pass' },
      { name: 'Community Service', credits: 2, grade: 'Pass (Non-GPA)' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBe(null);
  });

  it('ignores courses with zero credits', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'A' },
      { name: 'Lab', credits: 0, grade: 'F' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBe(4.0);
  });

  it('ignores courses with negative credits', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'B' },
      { name: 'Bad', credits: -1, grade: 'A' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBe(3.0);
  });

  it('ignores courses with non-numeric credits', () => {
    const courses = [
      { name: 'Math', credits: 3, grade: 'A' },
      { name: 'Bad', credits: 'abc', grade: 'B' },
    ];
    expect(calcGPA(courses, SCALE_4_0)).toBe(4.0);
  });

  it('counts I (Incomplete) as 0 points in 4.2 scale', () => {
    const courses = [
      { name: 'X', credits: 3, grade: 'I' },
    ];
    expect(calcGPA(courses, SCALE_4_2)).toBe(0);
  });
});

// ── semCreds & non-GPA credits ───────────────────────────────────────────────
describe('Credit helper functions', () => {
  it('semCreds sums only graded GPA courses', () => {
    const semester = {
      courses: [
        { name: 'A', credits: 3, grade: 'A' },
        { name: 'B', credits: 4, grade: 'B' },
        { name: 'C', credits: 2, isNonGpa: true, grade: 'A' },
        { name: 'D', credits: 3, grade: PENDING_GRADE },
      ],
    };
    expect(semCreds(semester, SCALE_4_0.points)).toBe(7);
  });

  it('semNonGpaCreds sums non-GPA course credits', () => {
    const semester = {
      courses: [
        { name: 'A', credits: 3, grade: 'A' },
        { name: 'C', credits: 2, isNonGpa: true, grade: 'A' },
        { name: 'D', credits: 4, grade: 'Pass (Non-GPA)' },
      ],
    };
    expect(semNonGpaCreds(semester)).toBe(6);
  });

  it('semPendingCreds sums pending credits', () => {
    const semester = {
      courses: [
        { name: 'A', credits: 3, grade: 'A' },
        { name: 'B', credits: 4, grade: PENDING_GRADE },
        { name: 'C', credits: 2, isNonGpa: true, grade: PENDING_GRADE }, // Non-GPA pending belongs to nonGpa
      ],
    };
    expect(semPendingCreds(semester)).toBe(4);
  });

  it('semTotalCreds sums all valid credit courses', () => {
    const semester = {
      courses: [
        { name: 'A', credits: 3, grade: 'A' },
        { name: 'B', credits: 4, isNonGpa: true, grade: 'Pass' },
        { name: 'C', credits: 3, grade: PENDING_GRADE },
      ],
    };
    expect(semTotalCreds(semester)).toBe(10);
  });
});

// ── normalizeSemesters ───────────────────────────────────────────────────────
describe('normalizeSemesters', () => {
  it('returns [] for non-array input', () => {
    expect(normalizeSemesters(null)).toEqual([]);
    expect(normalizeSemesters(undefined)).toEqual([]);
    expect(normalizeSemesters('nope')).toEqual([]);
    expect(normalizeSemesters(42)).toEqual([]);
  });

  it('generates id when missing', () => {
    const result = normalizeSemesters([{ name: 'S1', courses: [] }]);
    expect(result[0].id).toBeTruthy();
    expect(typeof result[0].id).toBe('string');
  });

  it('preserves existing id', () => {
    const result = normalizeSemesters([{ id: 'my-id', name: 'S1', courses: [] }]);
    expect(result[0].id).toBe('my-id');
  });

  it('defaults weight to 1 when missing', () => {
    const result = normalizeSemesters([{ name: 'S1', courses: [] }]);
    expect(result[0].weight).toBe(1);
  });

  it('generates name from index when missing', () => {
    const result = normalizeSemesters([{ courses: [] }]);
    expect(result[0].name).toBe('Semester 1');
  });

  it('preserves isNonGpa flag on course', () => {
    const result = normalizeSemesters([{
      name: 'S1',
      courses: [{ name: 'Training', credits: 2, grade: 'A', isNonGpa: true }],
    }]);
    expect(result[0].courses[0].isNonGpa).toBe(true);
  });

  it('decodes (Non-GPA) string tag in course grade', () => {
    const result = normalizeSemesters([{
      name: 'S1',
      courses: [{ name: 'Ethics', credits: 2, grade: 'A (Non-GPA)' }],
    }]);
    expect(result[0].courses[0].isNonGpa).toBe(true);
    expect(result[0].courses[0].grade).toBe('A');
  });

  it('preserves pending grade on course', () => {
    const result = normalizeSemesters([{ name: 'S1', courses: [{ name: 'Math', credits: 3, grade: PENDING_GRADE }] }]);
    expect(result[0].courses[0].grade).toBe(PENDING_GRADE);
  });
});
