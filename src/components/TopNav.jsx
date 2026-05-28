export default function TopNav({ view, setView, theme, currentUser, onOpenAuth, onLogout, onToggleTheme, onToggleSettings, showSettings, onExportCSV }) {
  const navBtn = (label, value) => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    background: view === value ? theme.accentBg : 'transparent',
    color: view === value ? theme.accent : theme.sub,
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ background: theme.card, borderBottom: `1px solid ${theme.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', height: 56, position: 'sticky', top: 0, zIndex: 50, gap: 6 }}>
      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: theme.accent, marginRight: 14, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>GPA<span style={{ color: theme.text }}>Vault</span></span>
      <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
        {[
          ['dashboard', 'Dashboard'],
          ['semesters', 'Semesters'],
          ['analytics', 'Analytics'],
          ['whatif', 'What-If'],
        ].map(([value, label]) => (
          <button key={value} onClick={() => setView(value)} style={navBtn(label, value)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: theme.sub, marginRight: 2 }}>{currentUser ? `Signed in as ${currentUser.email || currentUser.username || 'user'}` : 'Guest mode'}</span>
        <button onClick={onExportCSV} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.sub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>↓ CSV</button>
        <button onClick={onToggleSettings} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${showSettings ? theme.accent : theme.border}`, background: showSettings ? theme.accentBg : 'transparent', color: showSettings ? theme.accent : theme.sub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>⚙ Settings</button>
        {currentUser ? (
          <button onClick={onLogout} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.sub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Logout</button>
        ) : (
          <button onClick={onOpenAuth} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${theme.accent}`, background: theme.accentBg, color: theme.accent, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign in</button>
        )}
        <button onClick={onToggleTheme} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.sub, cursor: 'pointer', fontSize: 14 }}>{theme.isDark ? '☀' : '🌙'}</button>
      </div>
    </div>
  );
}
