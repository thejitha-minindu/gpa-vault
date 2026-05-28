import { gColDyn, uid } from '../utils/gpa';

export default function WhatIfView({ scale, theme, allCourses, whatIf, setWhatIf, targetGPA, setTargetGPA, targetCr, setTargetCr, projGPA, targetResult, scaleName, cgpa, calcGPAEff }) {
  const inputStyle = {
    background: theme.input,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '7px 11px',
    color: theme.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>What-If Planner</h1>
        <p style={{ color: theme.sub, fontSize: 14, margin: 0 }}>Forecast your GPA and find the grades you need to hit a target.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Current CGPA', val: cgpa.toFixed(2), color: gColDyn(cgpa, scale.max), note: 'from logged data', border: theme.border },
          { label: 'Projected CGPA', val: projGPA.toFixed(2), color: gColDyn(projGPA, scale.max), note: projGPA > cgpa ? `↑ +${(projGPA - cgpa).toFixed(2)}` : projGPA < cgpa ? `↓ ${(projGPA - cgpa).toFixed(2)}` : 'no change', border: 'rgba(232,184,75,0.4)' },
        ].map(({ label, val, color, note, border }) => (
          <div key={label} style={{ flex: 1, minWidth: 140, background: theme.card, border: `2px solid ${border}`, borderRadius: 14, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 42, fontWeight: 700, color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 13, color: theme.sub, marginTop: 6 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>Hypothetical Courses</div>
        <p style={{ color: theme.sub, fontSize: 13, margin: '0 0 14px' }}>Projected CGPA updates live as you add courses.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: theme.sub, fontWeight: 500 }}>
          <span style={{ flex: 2 }}>COURSE NAME</span><span style={{ width: 72 }}>CREDITS</span><span style={{ width: 96 }}>GRADE</span><span style={{ width: 28 }} />
        </div>

        {whatIf.map((row, index) => (
          <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input placeholder={`Course ${index + 1}`} value={row.name} onChange={e => setWhatIf(items => items.map(item => item.id === row.id ? { ...item, name: e.target.value } : item))} style={{ ...inputStyle, flex: 2, minWidth: 0 }} />
            <input type="number" value={row.credits} min={0.5} max={6} step={0.5} onChange={e => setWhatIf(items => items.map(item => item.id === row.id ? { ...item, credits: e.target.value } : item))} style={{ ...inputStyle, width: 72 }} />
            <select value={row.grade} onChange={e => setWhatIf(items => items.map(item => item.id === row.id ? { ...item, grade: e.target.value } : item))} style={{ ...inputStyle, width: 96, cursor: 'pointer' }}>
              {scale.grades.map(grade => <option key={grade} value={grade}>{scale.labels?.[grade] ?? grade} ({scale.points[grade]?.toFixed(scale.max >= 10 ? 0 : 1)})</option>)}
            </select>
            <button onClick={() => setWhatIf(items => items.filter(item => item.id !== row.id))} style={{ width: 28, height: 32, background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        ))}

        <button onClick={() => setWhatIf(items => [...items, { id: uid(), name: '', credits: 3, grade: scale.grades[0] }])} style={{ padding: '8px 16px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>+ Add Course</button>
      </div>

      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>Target GPA Calculator</div>
        <p style={{ color: theme.sub, fontSize: 13, margin: '0 0 16px' }}>What average grade do you need in upcoming credits to reach a target?</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>TARGET CGPA</div>
            <input type="number" placeholder={`e.g. ${(scale.max * 0.875).toFixed(1)}`} value={targetGPA} onChange={e => setTargetGPA(e.target.value)} min={0} max={scale.max} step={0.1} style={{ ...inputStyle, width: 110 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>REMAINING CREDITS</div>
            <input type="number" value={targetCr} min={1} max={200} onChange={e => setTargetCr(e.target.value)} style={{ ...inputStyle, width: 110 }} />
          </div>
        </div>

        {targetResult && (
          <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: targetResult.feasible ? theme.accentBg : 'rgba(248,113,113,0.1)', border: `1px solid ${targetResult.feasible ? 'rgba(232,184,75,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
            {targetResult.feasible ? (
              <>
                <div style={{ fontSize: 13, color: theme.sub, marginBottom: 4 }}>You need an average grade of:</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.accent, fontFamily: "'Playfair Display',serif", lineHeight: 1, marginBottom: 6 }}>{targetResult.neededAvg.toFixed(2)} pts</div>
                <div style={{ fontSize: 13, color: theme.sub }}>That's closest to <strong style={{ color: theme.text }}>{targetResult.closest}</strong> ({scale.points[targetResult.closest]?.toFixed(scale.max >= 10 ? 0 : 1)} pts) on the {scaleName} scale.</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#f87171' }}>This target isn't achievable with {targetCr} credits — it would require {targetResult.neededAvg > scale.max ? 'above the maximum possible' : 'negative'} grade points. Try adjusting the target or adding more credits.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
