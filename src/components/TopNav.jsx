import VaultLogo from './VaultLogo';

export default function TopNav({ view, setView, theme, currentUser, onLogout, onToggleTheme, onToggleSettings, showSettings, onExportCSV, saveStatus }) {
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

  const saveMsg = saveStatus?.message;
  const saveMsgColor = saveMsg?.includes('failed') ? '#f87171' : saveMsg === 'Saved to Supabase' ? theme.green : theme.accent;

  return (
    <div style={{ background: theme.card, borderBottom: `1px solid ${theme.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', height: 56, position: 'sticky', top: 0, zIndex: 50, gap: 6 }}>
      <VaultLogo size={28} theme={theme} onClick={() => setView('dashboard')} style={{ marginRight: 14, flexShrink: 0 }} />
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
        {saveMsg && <span style={{ fontSize: 11, color: saveMsgColor, fontWeight: 500, whiteSpace: 'nowrap' }}>{saveMsg}</span>}
        <span style={{ fontSize: 12, color: theme.sub, marginRight: 2 }}>{currentUser ? `Signed in as ${currentUser.email || currentUser.username || 'user'}` : 'Guest mode'}</span>
        <button
          onClick={onExportCSV}
          aria-label="Export CSV"
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.sub,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV
        </button>

        <button
          onClick={onToggleSettings}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: `1px solid ${showSettings ? theme.accent : theme.border}`,
            background: showSettings ? theme.accentBg : 'transparent',
            color: showSettings ? theme.accent : theme.sub,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>

        {currentUser && (
          <button
            onClick={onLogout}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.sub,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            Logout
          </button>
        )}

        <button
          onClick={onToggleTheme}
          aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.sub,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {theme.isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
