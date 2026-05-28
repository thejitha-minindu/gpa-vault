import { useState } from 'react';
import { calcGPA, fmt, gColDyn, semCreds } from '../utils/gpa';

export default function SemesterCard({ semester, scale, theme, onUpdate, onDelete, onAddCourse, onUpdateCourse, onDeleteCourse }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(semester.name);

  const gpa = calcGPA(semester.courses, scale);
  const credits = semCreds(semester, scale.points);
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
  };

  const commitName = () => {
    onUpdate({ name: nameVal });
    setEditing(false);
  };

  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: 12 }} onClick={() => setOpen(value => !value)}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
            <span
              style={{ fontSize: 15, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); setNameVal(semester.name); }}
            >
              {semester.name}
            </span>
          )}
          <span style={{ fontSize: 11, color: theme.sub, background: 'rgba(128,128,128,0.12)', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>{credits} cr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.sub, fontSize: 11, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
            Weight
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={semester.weight ?? 1}
              onChange={e => onUpdate({ weight: Number(e.target.value) })}
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle, width: 54, padding: '4px 6px', fontSize: 11 }}
            />
          </label>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{fmt(gpa)}</div>
            <div style={{ fontSize: 10, color: theme.sub, marginTop: 2 }}>GPA</div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.sub, fontSize: 15, padding: '4px 6px', borderRadius: 6, opacity: 0.6 }}>🗑</button>
          <span style={{ color: theme.sub, fontSize: 13, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'block' }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 0 6px', fontSize: 11, color: theme.sub, fontWeight: 500 }}>
            <span style={{ flex: 2 }}>COURSE NAME</span>
            <span style={{ width: 68 }}>CREDITS</span>
            <span style={{ width: 96 }}>GRADE</span>
            <span style={{ width: 40, textAlign: 'center' }}>PTS</span>
            <span style={{ width: 28 }} />
          </div>

          {semester.courses.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', color: theme.sub, fontSize: 13 }}>No courses yet.</div>}

          {semester.courses.map(course => (
            <div key={course.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${theme.border}` }}>
              <input placeholder="Course name" value={course.name} onChange={e => onUpdateCourse(course.id, { name: e.target.value })} style={{ ...inputStyle, flex: 2, minWidth: 0 }} />
              <input type="number" value={course.credits} min={0.5} max={6} step={0.5} onChange={e => onUpdateCourse(course.id, { credits: e.target.value })} style={{ ...inputStyle, width: 68 }} />
              <select value={course.grade} onChange={e => onUpdateCourse(course.id, { grade: e.target.value })} style={{ ...inputStyle, width: 96, cursor: 'pointer' }}>
                {scale.grades.map(grade => (
                  <option key={grade} value={grade}>{scale.labels?.[grade] ?? grade} ({scale.points[grade]?.toFixed(scale.max >= 10 ? 0 : 1)})</option>
                ))}
              </select>
              <div style={{ width: 40, textAlign: 'center', fontSize: 13, fontWeight: 600, color: gColDyn(scale.points[course.grade] ?? null, scale.max) }}>
                {scale.points[course.grade]?.toFixed(scale.max >= 10 ? 0 : 1) ?? '—'}
              </div>
              <button onClick={() => onDeleteCourse(course.id)} style={{ width: 28, background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 18, borderRadius: 6, lineHeight: 1 }}>×</button>
            </div>
          ))}

          <button onClick={onAddCourse} style={{ marginTop: 10, padding: '7px 14px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.25)`, borderRadius: 8, color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>+ Add Course</button>
        </div>
      )}
    </div>
  );
}
