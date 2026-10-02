import { useId, useState } from 'react';

/**
 * VaultLogo - Premium Academic Vault Crest Logo
 * 
 * Combines:
 * - Sovereign Academic Shield (heraldry / institutional trust)
 * - Graduation Mortarboard with golden tassel (GPA / academic achievement)
 * - High-security Bank Vault Combination Dial with calibrated ticks & star lock (Vault / secure storage)
 * - Interactive glow and scale response on hover
 */
export default function VaultLogo({
  size = 32,
  showText = true,
  subtitle = '',
  theme = {},
  onClick,
  style = {},
  className = '',
}) {
  const [hovered, setHovered] = useState(false);
  const id = useId();
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '');

  const isDark = theme.isDark ?? true;
  const accentColor = theme.accent || '#e8b84b';
  const textColor = theme.text || (isDark ? '#e8e0d0' : '#1f2937');
  const subColor = theme.sub || (isDark ? '#8896b0' : '#6b7280');

  // Height is slightly taller than width to maintain the classic shield proportions (100:112)
  const svgWidth = size;
  const svgHeight = Math.round(size * 1.12);

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size >= 40 ? 12 : 9,
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: onClick ? 'pointer' : 'default',
    textDecoration: 'none',
    userSelect: 'none',
    outline: 'none',
    ...style,
  };

  const emblemStyle = {
    flexShrink: 0,
    display: 'block',
    filter: hovered && onClick
      ? `drop-shadow(0 0 10px ${accentColor}80)`
      : isDark
        ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))'
        : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
    transform: hovered && onClick ? 'scale(1.04) translateY(-0.5px)' : 'scale(1)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const titleFontSize = size >= 44 ? 26 : size >= 36 ? 22 : 20;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={containerStyle}
      className={className}
      aria-label="GPA Vault Home"
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 100 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={emblemStyle}
      >
        <defs>
          <linearGradient id={`goldGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2C6" />
            <stop offset="35%" stopColor="#F5C056" />
            <stop offset="70%" stopColor="#E8B84B" />
            <stop offset="100%" stopColor="#AC7718" />
          </linearGradient>

          <linearGradient id={`shieldBg-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#1F283D" />
                <stop offset="50%" stopColor="#141B2B" />
                <stop offset="100%" stopColor="#0B0F19" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#FAF6ED" />
                <stop offset="100%" stopColor="#EDE5D1" />
              </>
            )}
          </linearGradient>

          <filter id={`crestGlow-${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#E8B84B" floodOpacity={isDark ? '0.3' : '0.18'} />
          </filter>
        </defs>

        {/* Outer Shield Base with Bevel */}
        <path
          d="M50 4 C68 4 92 11 92 22 C92 64 74 92 50 108 C26 92 8 64 8 22 C8 11 32 4 50 4 Z"
          fill={`url(#shieldBg-${safeId})`}
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="3.2"
          strokeLinejoin="round"
          filter={`url(#crestGlow-${safeId})`}
        />

        {/* Inner Etched Precision Track */}
        <path
          d="M50 12 C65 12 84 17 84 26 C84 62 68 86 50 99 C32 86 16 62 16 26 C16 17 35 12 50 12 Z"
          fill="none"
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="1.2"
          strokeOpacity={isDark ? '0.45' : '0.55'}
          strokeDasharray="3 2"
        />

        {/* Graduation Cap (Mortarboard Top) */}
        <path
          d="M50 22 L77 33 L50 44 L23 33 Z"
          fill={`url(#goldGrad-${safeId})`}
        />

        {/* Graduation Cap Skullcap Band */}
        <path
          d="M36 39 V47 C36 53 64 53 64 47 V39"
          fill="none"
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Graduation Cap Tassel */}
        <path
          d="M50 33 Q70 35 73 45"
          fill="none"
          stroke="#FFF2C6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="73" cy="48" r="2.4" fill="#FFF2C6" />

        {/* Bank Vault Dial / Precision Safe Wheel */}
        <circle
          cx="50"
          cy="72"
          r="16"
          fill={isDark ? '#101624' : '#FDFBF7'}
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="2.8"
        />

        {/* Precision Calibration Dial Ticks (Precision Calculation down to 0.01 GPA) */}
        <circle
          cx="50"
          cy="72"
          r="12"
          fill="none"
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="1.2"
          strokeDasharray="2 3.2"
          strokeOpacity={isDark ? '0.8' : '0.85'}
        />

        {/* Inner Dial Core Hub */}
        <circle
          cx="50"
          cy="72"
          r="6.5"
          fill={`url(#goldGrad-${safeId})`}
        />

        {/* Central Academic Star / Safe Keyhole Cutout */}
        <polygon
          points="50,67.5 51.5,70.5 54.5,72 51.5,73.5 50,76.5 48.5,73.5 45.5,72 48.5,70.5"
          fill={isDark ? '#101624' : '#FDFBF7'}
        />

        {/* 4 Vault Wheel Spoke Handles (North, South, West, East) */}
        <line x1="50" y1="52" x2="50" y2="55.5" stroke={`url(#goldGrad-${safeId})`} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="50" y1="88.5" x2="50" y2="92" stroke={`url(#goldGrad-${safeId})`} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="30" y1="72" x2="33.5" y2="72" stroke={`url(#goldGrad-${safeId})`} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="66.5" y1="72" x2="70" y2="72" stroke={`url(#goldGrad-${safeId})`} strokeWidth="2.6" strokeLinecap="round" />

        {/* Lower Achievement Laurel Arc */}
        <path
          d="M30 86 Q40 96 50 101 Q60 96 70 86"
          fill="none"
          stroke={`url(#goldGrad-${safeId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity={isDark ? '0.65' : '0.75'}
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: titleFontSize,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '-0.4px',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            GPA<span style={{ color: textColor }}>Vault</span>
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: size >= 44 ? 12 : 10,
                color: subColor,
                letterSpacing: '0.4px',
                marginTop: 3,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
