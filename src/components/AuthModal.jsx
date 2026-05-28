export default function AuthModal({ onGoogleLogin, isGoogleLoading, error, theme }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: 20 }}>
      <div style={{ width: 'min(420px, 100%)', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 24, boxShadow: '0 20px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: theme.text, marginBottom: 6 }}>GPA Vault</div>
        <p style={{ color: theme.sub, margin: '0 0 18px', fontSize: 14 }}>Continue with Google to sync your semester results and saved GPA data in Supabase.</p>

        {error && <div style={{ color: '#fca5a5', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={isGoogleLoading}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: isGoogleLoading ? 'rgba(232,184,75,0.35)' : theme.accent,
            border: 'none',
            borderRadius: 10,
            color: '#0d1117',
            fontWeight: 700,
            cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          {isGoogleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
