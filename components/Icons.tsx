// Lavigo icon set: 24px grid, 1.6 stroke, round joins, two-tone.
// The outline uses currentColor; the soft fill uses --ic-fill (set by the parent tile).
const F = 'var(--ic-fill, #CDBDF7)'

const paths: Record<string, React.ReactNode> = {
  group: (
    <>
      <circle cx="5.6" cy="9.4" r="2" />
      <path d="M2.2 18.4c.3-2.3 1.7-3.7 3.4-3.7.8 0 1.5.2 2.1.7" />
      <circle cx="18.4" cy="9.4" r="2" />
      <path d="M21.8 18.4c-.3-2.3-1.7-3.7-3.4-3.7-.8 0-1.5.2-2.1.7" />
      <circle cx="12" cy="8.6" r="2.9" fill={F} />
      <path d="M7 19.6c.5-3.2 2.5-5.1 5-5.1s4.5 1.9 5 5.1z" fill={F} />
    </>
  ),
  route: (
    <>
      <circle cx="5" cy="6.4" r="1.9" />
      <path d="M5 8.6v3.6a4.6 4.6 0 004.6 4.6h1.2" strokeDasharray="1.4 2.4" />
      <path d="M16 20.4s-5-4.4-5-8.4a5 5 0 0110 0c0 4-5 8.4-5 8.4z" fill={F} />
      <circle cx="16" cy="11.9" r="1.8" />
    </>
  ),
  weekend: (
    <>
      <circle cx="17" cy="6.5" r="2.4" fill={F} />
      <path d="M17 2.4v.8M21.1 6.5h-.8M19.9 3.6l-.6.6" />
      <path d="M2.5 19.5l5.8-8.6 3.6 5 2.4-3.1 5.2 6.7z" fill={F} />
      <path d="M6.6 13.4l1.7 1.3 1.6-1.2" />
      <path d="M2.5 19.5h19" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.8" fill={F} />
      <path d="M3.4 9.5h17.2M3.4 14.5h17.2" />
      <path d="M12 3.2c-2.4 2.4-3.6 5.4-3.6 8.8s1.2 6.4 3.6 8.8c2.4-2.4 3.6-5.4 3.6-8.8S14.4 5.6 12 3.2z" />
    </>
  ),
  vlog: (
    <>
      <rect x="2.6" y="6" width="13.4" height="12" rx="3" fill={F} />
      <path d="M16 10.4l4.2-2.6c.6-.4 1.3 0 1.3.7v7c0 .7-.7 1.1-1.3.7L16 13.6" />
      <path d="M7.7 9.6v4.8l4-2.4z" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8l7.4 2.9v5.6c0 4.6-3.1 8.4-7.4 9.9-4.3-1.5-7.4-5.3-7.4-9.9V5.7z" fill={F} />
      <path d="M8.6 12.2l2.3 2.3 4.6-4.8" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 9.6V8c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v1.6a2.4 2.4 0 000 4.8V16c0 .9-.7 1.6-1.6 1.6H4.6C3.7 17.6 3 16.9 3 16v-1.6a2.4 2.4 0 000-4.8z" fill={F} />
      <path d="M14.6 8.4v1M14.6 11.5v1M14.6 14.6v1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12.6" r="8" fill={F} />
      <path d="M12 8.4v4.4l2.8 1.8" />
      <path d="M9.6 2.6h4.8M18.6 5.4l1.4 1.4" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.2 7.6c0-1.3 1-2.3 2.3-2.3h11.2v2.3" />
      <rect x="3.2" y="7.6" width="17.6" height="12" rx="2.6" fill={F} />
      <path d="M20.8 11.4h-3.6a2 2 0 000 4h3.6" />
      <circle cx="17.3" cy="13.4" r=".6" fill="currentColor" />
    </>
  ),
  receipt: (
    <>
      <path d="M5.4 3h13.2v18l-2.2-1.4-2.2 1.4-2.2-1.4L9.8 21l-2.2-1.4L5.4 21z" fill={F} />
      <path d="M8.8 11.3l2.1 2.1 4.2-4.4" />
      <path d="M8.8 16.4h6.4" />
    </>
  ),
  leader: (
    <>
      <circle cx="9" cy="7.8" r="3" fill={F} />
      <path d="M3.2 20.2c.6-3.6 2.9-5.6 5.8-5.6s5.2 2 5.8 5.6z" fill={F} />
      <path d="M18.2 21V5" />
      <path d="M18.2 5.2h3.6l-1.1 1.9 1.1 1.9h-3.6" fill={F} />
    </>
  ),
  calendar: (
    <>
      <rect x="3.2" y="4.8" width="17.6" height="16" rx="3" fill={F} />
      <path d="M3.2 9.8h17.6M8 2.8v3.6M16 2.8v3.6" />
      <path d="M7.6 13.6h.01M12 13.6h.01M16.4 13.6h.01M7.6 17h.01M12 17h.01" strokeWidth="2.2" />
    </>
  ),
  hotel: (
    <>
      <path d="M3 18.6V6.4M3 14.8h18v3.8" />
      <path d="M21 14.8v-2.2c0-1.6-1.3-2.9-2.9-2.9H10.6v5.1z" fill={F} />
      <circle cx="7" cy="11.6" r="1.8" fill={F} />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3.4" width="16" height="14.6" rx="3.2" fill={F} />
      <path d="M4 11.6h16M4 7.4h16" />
      <path d="M7.4 21v-3M16.6 21v-3" />
      <path d="M7.8 14.9h.01M16.2 14.9h.01" strokeWidth="2.4" />
    </>
  ),
  meal: (
    <>
      <circle cx="13.6" cy="12" r="6.2" fill={F} />
      <circle cx="13.6" cy="12" r="3.2" />
      <path d="M3.6 3.4v5.2c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8V3.4M5.4 3.4v17.2" />
    </>
  ),
  play: <path d="M8 5.6v12.8c0 .7.8 1.2 1.4.8l10-6.4c.6-.4.6-1.2 0-1.6l-10-6.4c-.6-.4-1.4.1-1.4.8z" fill="currentColor" />,
  arrow: <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />,
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  )
}

// WhatsApp's own glyph, so the button is recognisable at a glance.
export function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z" />
    </svg>
  )
}
