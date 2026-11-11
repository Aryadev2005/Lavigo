// Lavigo icon set: 24px grid, one thin 1.5 stroke, round caps, no fills.
// Every icon is drawn the same way so they read as one family across the site.

const paths: Record<string, React.ReactNode> = {
  group: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" />
      <path d="M15.8 4.9a3.1 3.1 0 010 6.1M17.6 14.2c2 .7 3.4 2.6 3.4 5.3" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18h7.3a3.5 3.5 0 000-7h-7a3.5 3.5 0 010-7h6.3" />
    </>
  ),
  weekend: (
    <>
      <circle cx="16.5" cy="7" r="2.6" />
      <path d="M2.5 19.5h19M4.5 19.5l5.2-8 3.3 4.8 2.2-2.8 4.3 6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  vlog: (
    <>
      <rect x="2.8" y="6.3" width="12.7" height="11.4" rx="2.6" />
      <path d="M15.5 10.4l5.2-2.9v9l-5.2-2.9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.2 3v5.6c0 4.4-3 7.8-7.2 9.4-4.2-1.6-7.2-5-7.2-9.4V6z" />
      <path d="M8.8 12.1l2.2 2.2 4.2-4.3" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.8 7.6c0-.9.7-1.6 1.6-1.6h13.2c.9 0 1.6.7 1.6 1.6v2.2a2.2 2.2 0 000 4.4v2.2c0 .9-.7 1.6-1.6 1.6H5.4c-.9 0-1.6-.7-1.6-1.6v-2.2a2.2 2.2 0 000-4.4z" />
      <path d="M14.2 7.8v1.4M14.2 11.3v1.4M14.2 14.8v1.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  wallet: (
    <>
      <path d="M17.8 8V5.6c0-.6-.5-1-1-1H6a2.2 2.2 0 000 4.4" />
      <rect x="3.8" y="8" width="16.4" height="11.4" rx="2.4" />
      <path d="M16.4 13.7h.01" strokeWidth="2.2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </>
  ),
  leader: (
    <>
      <path d="M5.5 21V3.8" />
      <path d="M5.5 4.5h11.8l-2.4 3.7 2.4 3.7H5.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" />
      <path d="M3.5 9.8h17M8 3v3.6M16 3v3.6" />
    </>
  ),
  hotel: (
    <>
      <path d="M3 19V6M3 15h18v4" />
      <path d="M21 15v-2.4a3 3 0 00-3-3h-7.3V15" />
      <circle cx="6.9" cy="11.9" r="1.9" />
    </>
  ),
  bus: (
    <>
      <rect x="5" y="3.5" width="14" height="14" rx="3" />
      <path d="M5 11h14M8 20.5v-3M16 20.5v-3" />
      <path d="M8.6 14.4h.01M15.4 14.4h.01" strokeWidth="2.2" />
    </>
  ),
  meal: (
    <>
      <path d="M4.5 17.5a7.5 7.5 0 0115 0M3 17.5h18M12 10V8.6M3.5 20.5h17" />
    </>
  ),
  play: <path d="M8 5.6v12.8c0 .7.8 1.2 1.4.8l10-6.4c.6-.4.6-1.2 0-1.6l-10-6.4c-.6-.4-1.4.1-1.4.8z" fill="currentColor" stroke="none" />,
  arrow: <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />,
  car: (
    <>
      <path d="M5 16.8v-4.6l1.9-4.3c.3-.8 1.1-1.3 2-1.3h6.2c.9 0 1.7.5 2 1.3l1.9 4.3v4.6z" />
      <path d="M4 12.2h16M7 16.8v2.2M17 16.8v2.2" />
      <path d="M8 14.4h.01M16 14.4h.01" strokeWidth="2.2" />
    </>
  ),
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />,
  pin: (
    <>
      <path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0113 0c0 4.9-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4l-2.2 5-5 2.2 2.2-5z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  phone: <path d="M8.6 3.8l1.7 3.9-2 1.5a10.5 10.5 0 006.5 6.5l1.5-2 3.9 1.7-.5 3.3a1.6 1.6 0 01-1.7 1.3A16.6 16.6 0 014 6a1.6 1.6 0 011.3-1.7z" />,
  pencil: (
    <>
      <path d="M15.6 5.2l3.2 3.2L8.6 18.6 4.5 19.5l.9-4.1z" />
      <path d="M13.6 7.2l3.2 3.2" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5H6.5a2 2 0 00-2 2v11a2 2 0 002 2H14" />
      <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.6" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 17.5l5-4.5 4 3.5 2.5-2 4.5 4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10M19.5 4.5L11 13" />
      <path d="M17 13.5v4.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V8.5A1.5 1.5 0 016 7h4.5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.2M12 16.3h.01" />
    </>
  ),
  up: <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />,
  down: <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7.5" rx="2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  rupee: <path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-6 4H7l7 6" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />
    </>
  ),
  star: <path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  chat: <path d="M5 18.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9z" />,
  file: (
    <>
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" />
    </>
  ),
  video: (
    <>
      <rect x="3.5" y="6" width="12.5" height="12" rx="2.2" />
      <path d="M16 10.5l4.5-2.5v8L16 13.5" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="9" r="4.5" />
      <path d="M10.3 9.5h.01M13.7 9.5h.01M10.6 11.3c.8.6 2 .6 2.8 0M7.5 20c.9-2.4 2.5-3.6 4.5-3.6s3.6 1.2 4.5 3.6" />
    </>
  ),
  quote: <path d="M9.5 7C6.8 7.7 5.5 9.7 5.5 13v4h4.5v-4.5H7.6c0-2 .7-3.2 2.4-3.8zM18 7c-2.7.7-4 2.7-4 6v4h4.5v-4.5h-2.4c0-2 .7-3.2 2.4-3.8z" />,
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
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
