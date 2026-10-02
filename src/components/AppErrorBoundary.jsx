import React from 'react';
import VaultLogo from './VaultLogo';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d1117', color: '#e8e0d0', fontFamily: 'DM Sans, sans-serif', padding: 20 }}>
        <div style={{ maxWidth: 460, background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <VaultLogo size={36} theme={{ isDark: true, accent: '#e8b84b', text: '#e8e0d0', sub: '#8896b0' }} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 20 }}>GPA Vault could not load</h1>
          <p style={{ margin: '0 0 14px', color: '#8896b0', fontSize: 14 }}>Refresh the page. If it happens again, clear the saved GPA Vault data in this browser and sign in again.</p>
          <button
            type="button"
            onClick={() => {
              Object.keys(localStorage)
                .filter(key => key.startsWith('gpa-vault'))
                .forEach(key => localStorage.removeItem(key));
              window.location.reload();
            }}
            style={{ marginBottom: 14, padding: '9px 12px', border: 'none', borderRadius: 8, background: '#e8b84b', color: '#0d1117', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear saved data and reload
          </button>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 12 }}>{this.state.error.message}</pre>
        </div>
      </div>
    );
  }
}
