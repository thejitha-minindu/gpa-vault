export default function GpaRing({ gpa, max, col, T }) {
  const r = 44;
  const cx = 56;
  const cy = 56;
  const circ = 2 * Math.PI * r;
  const dash = gpa !== null ? Math.min(gpa / max, 1) * circ : 0;

  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.grid} strokeWidth={9} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={col} fontSize={18} fontWeight={700} fontFamily="'Playfair Display',serif">{gpa != null ? gpa.toFixed(2) : '—'}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={T.sub} fontSize={10} fontFamily="'DM Sans',sans-serif">/ {max}</text>
    </svg>
  );
}
