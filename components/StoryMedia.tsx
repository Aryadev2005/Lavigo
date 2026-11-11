import Image from 'next/image'
import type { MediaItem } from '@/lib/content'

/** One photo or video in a travel story, always with its caption underneath. */
export function StoryMedia({ m }: { m: MediaItem }) {
  return (
    <figure className={'bp-fig' + (m.type === 'video' ? ' is-video' : '')}>
      {m.type === 'video'
        ? <video src={m.src} poster={m.poster || undefined} controls playsInline preload="metadata" aria-label={m.caption || 'Trip video'} />
        : <span className="bp-img"><Image src={m.src} alt={m.caption || 'Trip photo'} fill sizes="(max-width:820px) 100vw, 780px" style={{ objectFit: 'cover' }} /></span>}
      {m.caption && <figcaption>{m.caption}</figcaption>}
    </figure>
  )
}
