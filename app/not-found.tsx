import Link from 'next/link'
export default function NotFound() {
  return (
    <section><div className="wrap"><div className="card" style={{ padding: 30, textAlign: 'center' }}>
      <h2>We could not find that page</h2>
      <p className="muted" style={{ margin: '8px 0 16px' }}>It may have moved, or the trip may no longer be listed.</p>
      <Link className="btn b-main" href="/trips">See group trips</Link>
    </div></div></section>
  )
}
