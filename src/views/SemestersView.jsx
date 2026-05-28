import SemesterCard from '../components/SemesterCard';

export default function SemestersView({ semesters, scale, theme, scaleName, addSemester, updateSemester, deleteSemester, addCourse, updateCourse, deleteCourse, setShowTemplate, onSave, saveStatus }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>Semesters</h1>
          <p style={{ color: theme.sub, fontSize: 14, margin: 0 }}>Scale: <strong style={{ color: theme.accent }}>{scaleName}</strong> · Double-click name to rename</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowTemplate(true)} style={{ padding: '8px 16px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: theme.accent, cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>📋 Template</button>
          <button onClick={onSave} disabled={saveStatus?.busy} style={{ padding: '9px 18px', background: saveStatus?.busy ? 'rgba(232,184,75,0.35)' : theme.accent, border: 'none', borderRadius: 10, color: '#0d1117', cursor: saveStatus?.busy ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', opacity: saveStatus?.busy ? 0.8 : 1 }}>Save</button>
          <button onClick={addSemester} style={{ padding: '9px 18px', background: theme.accent, border: 'none', borderRadius: 10, color: '#0d1117', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>+ Semester</button>
        </div>
      </div>

      {saveStatus?.message && (
        <div style={{ marginBottom: 14, color: saveStatus.message === 'Saved to account' ? theme.green : saveStatus.message === 'Save failed' ? '#f87171' : theme.accent, fontSize: 12, fontWeight: 500 }}>{saveStatus.message}</div>
      )}

      {semesters.length === 0 ? (
        <div style={{ background: theme.card, border: `2px dashed ${theme.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: theme.sub, fontSize: 14 }}>No semesters yet.</div>
      ) : semesters.map(semester => (
        <SemesterCard
          key={semester.id}
          semester={semester}
          scale={scale}
          theme={theme}
          onUpdate={patch => updateSemester(semester.id, patch)}
          onDelete={() => deleteSemester(semester.id)}
          onAddCourse={() => addCourse(semester.id)}
          onUpdateCourse={(courseId, patch) => updateCourse(semester.id, courseId, patch)}
          onDeleteCourse={courseId => deleteCourse(semester.id, courseId)}
        />
      ))}
    </div>
  );
}
