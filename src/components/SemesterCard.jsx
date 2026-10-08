import { useState } from 'react';
import PictureImportPanel from './PictureImportPanel';
import GradeSelect from './GradeSelect';
import {
  calcGPA,
  fmt,
  gColDyn,
  isNonGpaCourse,
  isPendingGrade,
  semCreds,
  semNonGpaCreds,
  semPendingCreds,
} from '../utils/gpa';

export default function SemesterCard({
  semester,
  scale,
  theme,
  isOpen,
  onToggle,
  onUpdate,
  onDelete,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onImportCourses,
}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const toggleOpen = () => {
    if (onToggle) onToggle();
    else setInternalOpen(v => !v);
  };

  const [editing, setEditing] = useState(false);
  const [showPictureImport, setShowPictureImport] = useState(false);
  const [nameVal, setNameVal] = useState(semester.name);

  const gpa = calcGPA(semester.courses, scale);
  const credits = semCreds(semester, scale.points);
  const pendingCredits = semPendingCreds(semester);
  const nonGpaCredits = semNonGpaCreds(semester);
  const color = gColDyn(gpa, scale.max);

  const inputStyle = {
    background: theme.input,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '6px 10px',
    color: theme.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    colorScheme: theme.isDark ? 'dark' : 'light',
  };

  const commitName = () => {
    onUpdate({ name: nameVal });
    setEditing(false);
  };

  return (
    <div id={`semester-${semester.id}`} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, marginBottom: 14, scrollMarginTop: 160, transition: 'border-color 0.15s ease, box-shadow 0.2s ease' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 18px',
          cursor: 'pointer',
          gap: 12,
          borderRadius: open ? '14px 14px 0 0' : 14,
          userSelect: 'none',
          transition: 'background 0.15s ease',
        }}
        onClick={toggleOpen}
        onMouseEnter={e => {
          e.currentTarget.style.background = theme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
          {editing ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => e.key === 'Enter' && commitName()}
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle, fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0 }}
            />
          ) : (
            <>
              <span
                style={{ fontSize: 15, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onDoubleClick={e => { e.stopPropagation(); setEditing(true); setNameVal(semester.name); }}
              >
                {semester.name}
              </span>
              {/* Clean SVG Edit Pencil */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setEditing(true); setNameVal(semester.name); }}
                aria-label={`Rename ${semester.name}`}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.sub, padding: '2px 4px', borderRadius: 4, opacity: 0.5, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            </>
          )}

          {/* Credits Summary Badge */}
          <span
            style={{
              fontSize: 11,
              color: credits === 0 && nonGpaCredits > 0 ? '#a5b4fc' : (credits === 0 && pendingCredits > 0 ? theme.accent : theme.sub),
              background: credits === 0 && nonGpaCredits > 0 ? 'rgba(99,102,241,0.1)' : (credits === 0 && pendingCredits > 0 ? theme.accentBg : 'rgba(128,128,128,0.12)'),
              border: `1px solid ${credits === 0 && nonGpaCredits > 0 ? 'rgba(99,102,241,0.25)' : (credits === 0 && pendingCredits > 0 ? 'rgba(232,184,75,0.3)' : 'transparent')}`,
              padding: '2px 8px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {credits > 0 ? `${credits} cr` : (nonGpaCredits > 0 ? `${nonGpaCredits} cr non-GPA` : `${pendingCredits} cr pending`)}
            {credits > 0 && nonGpaCredits > 0 && (
              <span style={{ color: '#a5b4fc', marginLeft: 4 }}>· {nonGpaCredits} non-GPA</span>
            )}
            {pendingCredits > 0 && (credits > 0 || nonGpaCredits > 0) && (
              <span style={{ color: theme.accent, marginLeft: 4 }}>· {pendingCredits} pending</span>
            )}
            {!open && (
              <span style={{ color: theme.sub, marginLeft: 5, opacity: 0.85 }}>
                · {semester.courses.length} course{semester.courses.length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.sub, fontSize: 11, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
            Weight
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={semester.weight ?? 1}
              onChange={e => onUpdate({ weight: Number(e.target.value) })}
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle, width: 50, padding: '3px 6px', fontSize: 11 }}
            />
          </label>
          <div
            style={{
              textAlign: 'right',
              minWidth: 64,
              padding: '4px 10px',
              borderRadius: 8,
              background: gpa !== null ? `${color}14` : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
              border: `1px solid ${gpa !== null ? `${color}33` : theme.border}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>{fmt(gpa)}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.sub, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {gpa === null && pendingCredits > 0
                ? 'Pending'
                : (gpa === null && nonGpaCredits > 0 && credits === 0 ? 'Non-GPA' : 'GPA')}
            </div>
          </div>

          {/* Clean SVG Trash Button */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            aria-label={`Delete ${semester.name}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.sub, padding: '4px', borderRadius: 6, opacity: 0.5, display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          {/* Clean SVG Chevron Icon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: theme.sub,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'block',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${theme.border}` }}>
          {/* Table Container — overflow visible so dropdown floats freely without nested scrollbars */}
          <div style={{ overflow: 'visible', paddingBottom: 2 }}>
            <div style={{ display: 'flex', gap: 8, padding: '9px 0 6px', fontSize: 11, color: theme.sub, fontWeight: 500 }}>
              <span style={{ flex: 2 }}>COURSE NAME</span>
              <span style={{ width: 62 }}>CREDITS</span>
              <span style={{ width: 78, textAlign: 'center' }}>TYPE</span>
              <span style={{ width: 148 }}>GRADE</span>
              <span style={{ width: 48, textAlign: 'center' }}>PTS</span>
              <span style={{ width: 28 }} />
            </div>

            {semester.courses.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', color: theme.sub, fontSize: 13 }}>No courses yet.</div>}

            {semester.courses.map(course => {
              const isCourseNonGpa = isNonGpaCourse(course);
              const isPending = isPendingGrade(course.grade);
              const gradePoints = scale.points[course.grade];

              return (
                <div key={course.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${theme.border}` }}>
                  <input placeholder="Course name" value={course.name} onChange={e => onUpdateCourse(course.id, { name: e.target.value })} style={{ ...inputStyle, flex: 2, minWidth: 0 }} />
                  <input type="number" value={course.credits} min={0.5} max={6} step={0.5} onChange={e => onUpdateCourse(course.id, { credits: e.target.value })} style={{ ...inputStyle, width: 62 }} />

                  {/* Professional Non-GPA / GPA Toggle Pill — No emojis */}
                  <div style={{ width: 78, display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCourse(course.id, {
                          isNonGpa: !isCourseNonGpa,
                        });
                      }}
                      title={
                        isCourseNonGpa
                          ? 'Non-GPA module: Excluded from GPA calculation. Click to switch to standard GPA module.'
                          : 'Standard GPA module: Included in GPA. Click to make this a Non-GPA module.'
                      }
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: `1px solid ${
                          isCourseNonGpa
                            ? (theme.isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.45)')
                            : theme.border
                        }`,
                        background: isCourseNonGpa
                          ? (theme.isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)')
                          : (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                        color: isCourseNonGpa ? '#a5b4fc' : theme.sub,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isCourseNonGpa ? 'Non-GPA' : 'GPA'}
                    </button>
                  </div>

                  <GradeSelect
                    value={course.grade}
                    onChange={grade => onUpdateCourse(course.id, { grade })}
                    scale={scale}
                    theme={theme}
                    width={148}
                  />

                  {/* Points Column */}
                  <div
                    style={{
                      width: 48,
                      textAlign: 'center',
                      fontSize: isCourseNonGpa ? 11 : 13,
                      fontWeight: 600,
                      color: isCourseNonGpa
                        ? '#a5b4fc'
                        : isPending
                        ? theme.sub
                        : gColDyn(gradePoints ?? null, scale.max),
                    }}
                  >
                    {isCourseNonGpa ? (
                      <span
                        title="Excluded from GPA calculation"
                        style={{
                          background: theme.isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.12)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        Excl.
                      </span>
                    ) : isPending ? (
                      '—'
                    ) : (
                      gradePoints?.toFixed(scale.max >= 10 ? 0 : 1) ?? '—'
                    )}
                  </div>

                  {/* Clean SVG Delete Row Button */}
                  <button
                    type="button"
                    onClick={() => onDeleteCourse(course.id)}
                    aria-label={`Delete ${course.name || 'course'}`}
                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0.65, borderRadius: 6, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.65'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onAddCourse}
              style={{
                padding: '7px 14px',
                background: theme.accentBg,
                border: `1px solid rgba(232,184,75,0.25)`,
                borderRadius: 8,
                color: theme.accent,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              + Add Module
            </button>
            <button
              type="button"
              onClick={() => setShowPictureImport(value => !value)}
              style={{
                padding: '7px 14px',
                background: theme.input,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              Import Picture
            </button>
          </div>

          {showPictureImport && (
            <PictureImportPanel
              scale={scale}
              theme={theme}
              onClose={() => setShowPictureImport(false)}
              onImport={(courses, options) => onImportCourses(courses, options)}
            />
          )}
        </div>
      )}
    </div>
  );
}
