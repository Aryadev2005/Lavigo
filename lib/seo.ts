import type { Metadata } from 'next'
import { BUSINESS, SITE_URL } from './config'

/** The share card used when a page has no photo of its own (1200x630 JPG: WhatsApp, Facebook and X all show it). */
export const DEFAULT_OG = { url: '/og.jpg', width: 1200, height: 630, alt: 'Lavigo Travel Co. group trip in Nepal' }

/** Makes a site path or an uploaded (Supabase) image URL absolute, for structured data. */
export function absUrl(src: string): string {
  return /^https?:\/\//.test(src) ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`
}

/**
 * Metadata for one public page: title, description, canonical URL and a complete share card.
 * Next.js replaces (does not merge) the layout's openGraph object, so every page builds its own
 * here; otherwise link previews show the homepage's URL and title.
 */
export function pageMeta(o: { title: string; description: string; path: string; image?: string | null; imageAlt?: string; type?: 'website' | 'article'; publishedTime?: string; absoluteTitle?: boolean }): Metadata {
  const images = o.image ? [{ url: o.image, alt: o.imageAlt ?? o.title }] : [DEFAULT_OG]
  const shareTitle = o.absoluteTitle ? o.title : `${o.title} | ${BUSINESS.name}`
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: {
      type: o.type ?? 'website',
      siteName: BUSINESS.name,
      locale: 'en_IN',
      url: o.path,
      title: shareTitle,
      description: o.description,
      images,
      ...(o.publishedTime ? { publishedTime: o.publishedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description: o.description, images: images.map((i) => i.url) },
  }
}

/** Trims text to a search-snippet length (about 155 characters) on a word boundary. */
export function snippet(text: string, max = 155): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…'
}
