// Decorative animation for the home hero: no video, no photo. The Lavigo wordmark fades in
// letter by letter on the deep indigo background, a marigold mark settles last, and a faint
// lavender mountain line drifts behind it. CSS-only (keyframes in app/premium.css), so it costs
// nothing to load. Respects prefers-reduced-motion: see the "no-preference" guard in the CSS.
const LETTERS = ['L', 'A', 'V', 'I', 'G', 'O']

export function HeroLogoIntro() {
  return (
    <div className="hl" aria-hidden="true">
      <svg className="hl-mtn" viewBox="0 0 1200 300" preserveAspectRatio="none" focusable="false">
        <path d="M-50 230 L120 120 L230 190 L360 70 L520 200 L650 110 L800 210 L950 90 L1100 180 L1250 120 L1250 300 L-50 300 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M-50 260 L160 170 L300 220 L480 130 L620 230 L780 150 L940 240 L1100 160 L1250 220" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="hl-word">
        {LETTERS.map((ch, i) => (
          <span key={i} className="hl-l" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>{ch}</span>
        ))}
        <span className="hl-dot" style={{ animationDelay: `${0.15 + LETTERS.length * 0.1 + 0.35}s` }} />
      </div>
    </div>
  )
}
