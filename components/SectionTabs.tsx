'use client'
import { useEffect, useState } from 'react'

// Sticky sub-nav for the trip page. Underlines the section currently under the header.
export function SectionTabs({ items }: { items: { id: string; label: string }[] }) {
  const [on, setOn] = useState(items[0]?.id)
  const key = items.map((t) => t.id).join()
  useEffect(() => {
    const ids = key.split(',')
    const update = () => {
      const line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head-h')) || 0) + 120
      // The section nearest above the line wins. "book" is a sticky sidebar on desktop, so it only takes part when stacked (mobile).
      let cur = ids[0], best = -Infinity
      for (const id of ids) {
        if (id === 'book' && window.innerWidth > 960) continue
        const top = document.getElementById(id)?.getBoundingClientRect().top ?? Infinity
        if (top <= line && top > best) { best = top; cur = id }
      }
      setOn(cur)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [key])
  return (
    <nav className="m-stabs" aria-label="Trip sections">
      <div className="m-wrap">
        {items.map((t) => <a key={t.id} href={'#' + t.id} className={on === t.id ? 'on' : undefined} aria-current={on === t.id ? 'location' : undefined}>{t.label}</a>)}
      </div>
    </nav>
  )
}
