// Fallback artwork (gradient mountains) for destinations that have no photo yet.
export function Art({ theme, h = 170, variant = 0, id }: { theme: [string, string, string]; h?: number; variant?: number; id: string }) {
  const c = theme
  const gid = 'g-' + id.replace(/[^a-z0-9]/gi, '') + variant
  return (
    <svg viewBox={`0 0 400 ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient></defs>
      <rect width="400" height={h} fill={`url(#${gid})`} />
      <circle cx={300 - variant * 40} cy={h * 0.32} r={h * 0.14} fill={c[2]} opacity=".9" />
      <path d={`M0 ${h} L0 ${h * 0.62} L70 ${h * 0.38} L130 ${h * 0.58} L210 ${h * 0.22} L280 ${h * 0.52} L340 ${h * 0.36} L400 ${h * 0.56} L400 ${h}Z`} fill="#fff" opacity=".18" />
      <path d={`M0 ${h} L0 ${h * 0.78} L90 ${h * 0.6} L170 ${h * 0.76} L260 ${h * 0.58} L340 ${h * 0.74} L400 ${h * 0.66} L400 ${h}Z`} fill={c[0]} opacity=".55" />
    </svg>
  )
}
