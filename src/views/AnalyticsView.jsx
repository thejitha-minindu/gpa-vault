import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts';
import { calcGPA, fmt, gColDyn, semCreds } from '../utils/gpa';

const DIST_COLORS = ['#34d399', '#6ee7b7', '#fbbf24', '#fb923c', '#f87171', '#ef4444'];

export default function AnalyticsView({ semesters, scale, theme, chartData, allCourses, cgpa, totalCreds, gradeDistData }) {
  const ttStyle = { background: theme.ttBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13 };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>Analytics</h1>
        <p style={{ color: theme.sub, fontSize: 14, margin: 0 }}>Performance breakdown across your academic career.</p>
      </div>

      {!chartData.length ? (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 48, textAlign: 'center', color: theme.sub, fontSize: 14 }}>Add at least one graded semester to unlock analytics.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Cumulative GPA', val: fmt(cgpa), col: gColDyn(cgpa, scale.max) },
              { label: 'Best semester', val: fmt(Math.max(...chartData.map(item => item.gpa))), col: '#34d399' },
              { label: 'Worst semester', val: fmt(Math.min(...chartData.map(item => item.gpa))), col: gColDyn(Math.min(...chartData.map(item => item.gpa)), scale.max) },
              { label: 'Avg credits', val: parseFloat((chartData.reduce((sum, item) => sum + item.credits, 0) / chartData.length).toFixed(1)), col: theme.accent },
              { label: 'Total courses', val: allCourses.length, col: '#60a5fa' },
              { label: 'Graded entries', val: allCourses.filter(course => course.grade in scale.points).length, col: theme.sub },
            ].map(({ label, val, col: metricColor }) => (
              <div key={label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: metricColor, fontFamily: "'Playfair Display',serif" }}>{val}</div>
              </div>
            ))}
          </div>

          {chartData.length >= 2 && (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '18px 20px 10px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 2 }}>GPA over time</div>
              <div style={{ fontSize: 12, color: theme.sub, marginBottom: 14 }}>Semester GPA across all terms</div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8b84b" stopOpacity={0.4} /><stop offset="95%" stopColor="#e8b84b" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                  <XAxis dataKey="name" tick={{ fill: theme.sub, fontSize: 12 }} />
                  <YAxis domain={[0, scale.max]} tick={{ fill: theme.sub, fontSize: 12 }} tickCount={5} />
                  <Tooltip contentStyle={ttStyle} formatter={value => [value, 'GPA']} />
                  <Area type="monotone" dataKey="gpa" stroke="#e8b84b" fill="url(#areaG)" strokeWidth={2.5} dot={{ fill: '#e8b84b', r: 5 }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '18px 16px 10px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 2 }}>Credits per semester</div>
              <div style={{ fontSize: 12, color: theme.sub, marginBottom: 12 }}>Credit load by term</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -26 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                  <XAxis dataKey="name" tick={{ fill: theme.sub, fontSize: 11 }} />
                  <YAxis tick={{ fill: theme.sub, fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} formatter={value => [value, 'Credits']} />
                  <Bar dataKey="credits" fill="#60a5fa" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '18px 16px 10px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 2 }}>Grade distribution</div>
              <div style={{ fontSize: 12, color: theme.sub, marginBottom: 12 }}>Frequency of each grade</div>
              {gradeDistData.length === 0 ? (
                <div style={{ color: theme.sub, fontSize: 13, padding: '20px 0' }}>No graded courses yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={gradeDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={58} innerRadius={28} paddingAngle={3}>
                      {gradeDistData.map((entry, index) => <Cell key={index} fill={DIST_COLORS[index % DIST_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle} formatter={(value, name) => [`${value} course${value !== 1 ? 's' : ''}`, name]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: theme.sub }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
