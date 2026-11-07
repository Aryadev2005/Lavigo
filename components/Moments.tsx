'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Reel } from '@/lib/media'
import { Icon } from './Icons'

// Row of vertical video cards. Cards without a video open Instagram instead.
export function Moments({ reels, instagram }: { reels: Reel[]; instagram: string }) {
  const [open, setOpen] = useState<Reel | null>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  return (
    <>
      <div className="m-reels">
        {reels.map((r) => {
          const inner = (
            <>
              <Image src={r.poster} alt="" fill sizes="(max-width:600px) 50vw, (max-width:980px) 33vw, 230px" style={{ objectFit: 'cover' }} />
              <span className="m-reel-shade" />
              <span className="m-reel-play" aria-hidden="true"><Icon name="play" size={20} /></span>
              <span className="m-reel-l">{r.label}</span>
            </>
          )
          return r.video ? (
            <button key={r.label} type="button" className="m-reel" onClick={() => setOpen(r)} aria-label={`Play video: ${r.label}`}>{inner}</button>
          ) : (
            <a key={r.label} className="m-reel" href={instagram} target="_blank" rel="noopener" aria-label={`${r.label} (opens Instagram)`}>{inner}</a>
          )
        })}
      </div>
      {open?.video && (
        <div className="lbx" role="dialog" aria-modal="true" aria-label={open.label} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}>
          <video src={open.video} poster={open.poster} controls autoPlay playsInline style={{ maxWidth: '92vw', maxHeight: '84vh', borderRadius: 12 }} />
          <p>{open.label}</p>
          <button className="lx" aria-label="Close" onClick={() => setOpen(null)}>×</button>
        </div>
      )}
    </>
  )
}
