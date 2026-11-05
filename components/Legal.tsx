export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <section><div className="wrap prose" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,38px)', letterSpacing: '-.02em' }}>{title}</h1>
      <p className="muted" style={{ marginBottom: 14 }}>Last updated {updated}</p>
      {children}
    </div></section>
  )
}
