'use client'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import type { GalleryImage } from '@/lib/types'

type Open = { list: GalleryImage[]; i: number; label: string } | null

function useLightbox() {
  const [open, setOpen] = useState<Open>(null)
  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((d: number) => setOpen((o) => (o ? { ...o, i: (o.i + d + o.list.length) % o.list.length } : o)), [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, close, step])
  const box = open && (
    <div className="lbx" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={open.list[open.i].src} alt={open.list[open.i].caption} />
      <p>{open.list[open.i].caption} · {open.label}<small>{open.i + 1} / {open.list.length}</small></p>
      <button className="lx" aria-label="Close" onClick={close}>×</button>
      <button className="lp" aria-label="Previous" onClick={() => step(-1)}>‹</button>
      <button className="ln" aria-label="Next" onClick={() => step(1)}>›</button>
    </div>
  )
  return { setOpen, box }
}

export function GalleryStrip({ images, label }: { images: GalleryImage[]; label: string }) {
  const { setOpen, box } = useLightbox()
  return (
    <>
      <div className="strip">
        {images.map((g, j) => (
          <button key={g.src} onClick={() => setOpen({ list: images, i: j, label })} aria-label={`View photo: ${g.caption}`}>
            <Image src={g.src} alt={g.caption} fill sizes="200px" style={{ objectFit: 'cover' }} />
            <span>{g.caption}</span>
          </button>
        ))}
      </div>
      {box}
    </>
  )
}

// Trip page photo grid: one large photo and four small ones; the last opens the full set.
export function GalleryGrid({ images, label }: { images: GalleryImage[]; label: string }) {
  const { setOpen, box } = useLightbox()
  const shown = images.slice(0, 5)
  const more = images.length - shown.length
  return (
    <>
      <div className={'m-gal m-gal-' + shown.length}>
        {shown.map((g, j) => (
          <button key={g.src + j} type="button" onClick={() => setOpen({ list: images, i: j, label })} aria-label={`View photo: ${g.caption}`}>
            <Image src={g.src} alt={g.caption} fill priority={j === 0} sizes={j === 0 ? '(max-width:900px) 100vw, 600px' : '(max-width:900px) 50vw, 300px'} style={{ objectFit: 'cover' }} />
            {j === shown.length - 1 && more > 0 && <span className="m-gal-more">+{more} photos</span>}
          </button>
        ))}
      </div>
      {box}
    </>
  )
}

// Home page photo wall from a real trip; wide photos span two columns.
export function PhotoWall({ photos, label }: { photos: (GalleryImage & { wide?: boolean })[]; label: string }) {
  const { setOpen, box } = useLightbox()
  return (
    <>
      <div className="m-wall">
        {photos.map((g, j) => (
          <button key={g.src} type="button" className={g.wide ? 'wide' : undefined} onClick={() => setOpen({ list: photos, i: j, label })} aria-label={`View photo: ${g.caption}`}>
            <Image src={g.src} alt={g.caption} fill sizes={g.wide ? '(max-width:600px) 100vw, 50vw' : '(max-width:600px) 50vw, 25vw'} style={{ objectFit: 'cover' }} />
            <span>{g.caption}</span>
          </button>
        ))}
      </div>
      {box}
    </>
  )
}

export type MosaicItem = { label: string; list: GalleryImage[]; index: number }
export function Mosaic({ items }: { items: MosaicItem[] }) {
  const { setOpen, box } = useLightbox()
  return (
    <>
      <div className="mosaic">
        {items.map((it, n) => {
          const g = it.list[it.index]
          return (
            <button key={g.src} className={`mo m${n}`} onClick={() => setOpen({ list: it.list, i: it.index, label: it.label })} aria-label={`View photo: ${g.caption}`}>
              <Image src={g.src} alt={g.caption} fill sizes="(max-width:820px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
              <span><b>{it.label}</b>{g.caption}</span>
            </button>
          )
        })}
      </div>
      {box}
    </>
  )
}
