import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import GpaRing from '../components/GpaRing';
import { calcGPA, fmt, gColDyn, isNonGpaCourse, isPendingGrade, semCreds, semNonGpaCreds, semPendingCreds } from '../utils/gpa';

export default function DashboardView({ semesters, scale, scaleName, theme, priorGPA, priorCreds, chartData, cgpa, cgpaOwn, totalCreds, totalNonGpaCreds = 0, bestEntry, addSemester, setView, onSelectSemester }) {
  const col = gColDyn(cgpa, scale.max);
  const colOwn = gColDyn(cgpaOwn, scale.max);
  const ttStyle = { background: theme.ttBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13 };

  const totalPendingCreds = (semesters || [])
    .flatMap(s => s.courses || [])
    .filter(c => !isNonGpaCourse(c) && isPendingGrade(c.grade) && Number(c.credits) > 0)
    .reduce((sum, c) => sum + Number(c.credits), 0);

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
          {
            label: 'Total Credits',
            val: (totalCreds || 0) + (totalNonGpaCreds || 0),
            col: theme.accent,
            sub: [
              totalNonGpaCreds > 0 ? `${totalCreds} GPA + ${totalNonGpaCreds} non-GPA` : `${semesters.length} semester${semesters.length !== 1 ? 's' : ''}`,
              totalPendingCreds > 0 ? `${totalPendingCreds} pending` : null,
            ].filter(Boolean).join(' · '),
          },
          {
            label: 'Best Semester',
            val: bestEntry ? fmt(bestEntry.gpa) : '—',
            col: bestEntry ? gColDyn(bestEntry.gpa, scale.max) : theme.sub,
            sub: bestEntry?.name ?? '—',
            onClick: bestEntry?.id && onSelectSemester ? () => onSelectSemester(bestEntry.id) : null,
          },
        ].map(({ label, val, col: boxColor, sub, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              cursor: onClick ? 'pointer' : 'default',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => {
              if (onClick) {
                e.currentTarget.style.borderColor = theme.accent;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={e => {
              if (onClick) {
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Semesters</div>
            <span style={{ fontSize: 11, color: theme.sub }}>Click a semester to view & edit</span>
          </div>
          {semesters.length === 0 ? (
            <div style={{ color: theme.sub, fontSize: 13, marginBottom: 10 }}>No semesters yet.</div>
          ) : semesters.map(semester => {
            const gpaValue = calcGPA(semester.courses, scale);
            const creditsValue = semCreds(semester, scale.points);
            const pendingCredits = semPendingCreds(semester);
            const nonGpaCredits = semNonGpaCreds(semester);
            return (
              <div
                key={semester.id}
                style={{
                  marginBottom: 10,
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 8,
                  transition: 'background 0.15s ease',
                }}
                onClick={() => onSelectSemester ? onSelectSemester(semester.id) : setView('semesters')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title={`Open and edit ${semester.name}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '65%' }}>
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{semester.name}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.sub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: gColDyn(gpaValue, scale.max) }}>
                    {fmt(gpaValue)}{' '}
                    <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}>
                      ({creditsValue} cr{nonGpaCredits > 0 ? ` · ${nonGpaCredits} non-GPA` : ''}{pendingCredits > 0 ? ` · ${pendingCredits} pending` : ''})
                    </span>
                  </span>
                </div>
                <div style={{ height: 6, background: theme.grid, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gpaValue !== null ? (gpaValue / scale.max) * 100 : 0}%`, background: gColDyn(gpaValue, scale.max), borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}

          <button
            onClick={() => {
              const newId = addSemester();
              if (newId && onSelectSemester) {
                onSelectSemester(newId);
              } else {
                setView('semesters');
              }
            }}
            style={{ padding: '6px 14px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}
          >
            + Add Semester
          </button>
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
