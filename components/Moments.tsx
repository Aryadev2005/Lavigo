'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { Reel } from '@/lib/media'
import { Icon } from './Icons'

function ReelCard({ r, onOpen }: { r: Reel; onOpen: () => void }) {
  const v = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  // muted preview on hover (mouse only; touch devices just tap to open)
  const start = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !v.current) return
    v.current.play().then(() => setPlaying(true)).catch(() => {})
  }
  const stop = () => {
    if (!v.current) return
    v.current.pause()
    v.current.currentTime = 0
    setPlaying(false)
  }
  return (
    <button type="button" className={'m-reel' + (playing ? ' is-playing' : '')} onClick={onOpen} onPointerEnter={start} onPointerLeave={stop} aria-label={`Play video: ${r.label}`}>
      <Image src={r.poster} alt="" fill sizes="(max-width:600px) 46vw, (max-width:980px) 33vw, 280px" style={{ objectFit: 'cover' }} />
      {r.video && <video ref={v} className="m-reel-vid" src={r.video} muted loop playsInline preload="none" aria-hidden="true" />}
      <span className="m-reel-shade" />
      <span className="m-reel-play" aria-hidden="true"><Icon name="play" size={20} /></span>
      <span className="m-reel-l">{r.label}</span>
    </button>
  )
}

// Grid of vertical trip videos. Cards without a video open Instagram instead.
export function Moments({ reels, instagram }: { reels: Reel[]; instagram: string }) {
  const [open, setOpen] = useState<Reel | null>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div className="m-reels">
        {reels.map((r) => r.video
          ? <ReelCard key={r.label} r={r} onOpen={() => setOpen(r)} />
          : (
            <a key={r.label} className="m-reel" href={instagram} target="_blank" rel="noopener" aria-label={`${r.label} (opens Instagram)`}>
              <Image src={r.poster} alt="" fill sizes="(max-width:600px) 46vw, (max-width:980px) 33vw, 280px" style={{ objectFit: 'cover' }} />
              <span className="m-reel-shade" />
              <span className="m-reel-play" aria-hidden="true"><Icon name="play" size={20} /></span>
              <span className="m-reel-l">{r.label}</span>
            </a>
          ))}
      </div>
      {open?.video && (
        <div className="lbx" role="dialog" aria-modal="true" aria-label={open.label} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}>
          <video src={open.video} poster={open.poster} controls autoPlay playsInline className="m-lbx-vid" />
          <p>{open.label}</p>
          <button className="lx" aria-label="Close" onClick={() => setOpen(null)}>×</button>
        </div>
      )}
    </>
  )
}
