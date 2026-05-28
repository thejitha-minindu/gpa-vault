import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import GpaRing from '../components/GpaRing';
import { calcGPA, fmt, gColDyn, semCreds } from '../utils/gpa';

export default function DashboardView({ semesters, scale, scaleName, theme, priorGPA, priorCreds, chartData, cgpa, cgpaOwn, totalCreds, bestEntry, addSemester, setView }) {
  const col = gColDyn(cgpa, scale.max);
  const colOwn = gColDyn(cgpaOwn, scale.max);
  const ttStyle = { background: theme.ttBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13 };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>Academic Dashboard</h1>
        <p style={{ color: theme.sub, fontSize: 14, margin: 0 }}>
          Scale: <strong style={{ color: theme.accent }}>{scaleName}</strong>
          {priorGPA && priorCreds ? ` · Prior: ${parseFloat(priorGPA).toFixed(2)} GPA / ${priorCreds} cr included` : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Cumulative GPA', val: fmt(cgpa), col, sub: priorGPA && priorCreds ? 'incl. prior record' : cgpa ? (cgpa >= scale.max * 0.875 ? 'First Class' : cgpa >= scale.max * 0.75 ? 'Good Standing' : 'Passing') : 'No data' },
          { label: 'Own GPA', val: fmt(cgpaOwn), col: colOwn, sub: 'current semesters only' },
          { label: 'Total Credits', val: totalCreds || 0, col: theme.accent, sub: `${semesters.length} semester${semesters.length !== 1 ? 's' : ''}` },
          { label: 'Best Semester', val: bestEntry ? fmt(bestEntry.gpa) : '—', col: bestEntry ? gColDyn(bestEntry.gpa, scale.max) : theme.sub, sub: bestEntry?.name ?? '—' },
        ].map(({ label, val, col: boxColor, sub }) => (
          <div key={label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: boxColor, fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>{val}</div>
            <div style={{ fontSize: 12, color: theme.sub, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <GpaRing gpa={cgpa} max={scale.max} col={col} T={theme} />
          <div style={{ fontSize: 11, color: theme.sub, marginTop: 6, textAlign: 'center' }}>CGPA / {scale.max}</div>
        </div>

        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 12 }}>Semesters</div>
          {semesters.length === 0 ? (
            <div style={{ color: theme.sub, fontSize: 13, marginBottom: 10 }}>No semesters yet.</div>
          ) : semesters.map(semester => {
            const gpaValue = calcGPA(semester.courses, scale);
            const creditsValue = semCreds(semester, scale.points);
            return (
              <div key={semester.id} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setView('semesters')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: theme.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{semester.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: gColDyn(gpaValue, scale.max) }}>{fmt(gpaValue)} <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}>({creditsValue} cr)</span></span>
                </div>
                <div style={{ height: 6, background: theme.grid, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gpaValue !== null ? (gpaValue / scale.max) * 100 : 0}%`, background: gColDyn(gpaValue, scale.max), borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}

          <button onClick={() => { addSemester(); setView('semesters'); }} style={{ padding: '6px 14px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>+ Add Semester</button>
        </div>
      </div>

      {chartData.length >= 2 && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '16px 20px 10px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 10 }}>GPA trend</div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <defs><linearGradient id="miniG" x1="0" y1="0" x2="0" y2="1"><stop offset="10%" stopColor="#e8b84b" stopOpacity={0.3} /><stop offset="95%" stopColor="#e8b84b" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="name" tick={{ fill: theme.sub, fontSize: 11 }} />
              <YAxis domain={[0, scale.max]} tick={{ fill: theme.sub, fontSize: 11 }} tickCount={5} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="gpa" stroke="#e8b84b" fill="url(#miniG)" strokeWidth={2} dot={{ fill: '#e8b84b', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
