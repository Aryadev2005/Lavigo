'use client'
import { useMemo } from 'react'
import type { Reel } from '@/lib/media'
import CircularGallery from './CircularGallery'
import './CircularGallery.css'

// Curved, auto-scrolling gallery of trip videos. Click a card to expand it in place.
export function Moments({ reels }: { reels: Reel[]; instagram?: string }) {
  const items = useMemo(() => reels.map((r) => ({ image: r.poster, video: r.video, text: r.label, alt: r.label })), [reels])
  return (
    <div className="m-moments" aria-label="Trip videos. Drag or scroll sideways, click a card to expand it.">
      <CircularGallery
        items={items}
        bend={2.4}
        textColor="#221847"
        font="600 19px Figtree"
        fontUrl="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&display=swap"
        itemAspect={0.62}
        gap={0.3}
        borderRadius={0.06}
        shadow={0.28}
        fadeEdges={0.1}
        autoScroll={0.6}
      />
      <p className="m-moments-hint">Drag or scroll · click a card to expand</p>
    </div>
  )
}
