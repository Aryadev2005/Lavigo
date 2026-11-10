'use client'
import { useRef, useState } from 'react'
import { uploadImage } from '@/app/admin/actions'
import { Icon } from '@/components/Icons'

// Shrinks big phone photos in the browser before upload (keeps uploads small and fast).
export async function downscale(file: File, max = 1800): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), 'image/jpeg', 0.84))
}
export async function sendPhoto(f: File): Promise<{ url?: string; error?: string }> {
  try {
    const blob = await downscale(f)
    const fd = new FormData()
    fd.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
    return await uploadImage(fd)
  } catch {
    return { error: `Could not read "${f.name}". Use a JPG, PNG or WebP photo.` }
  }
}

/** One photo: preview + upload/replace/remove. Posts its URL under `name`. */
export function ImageField({ value, onChange, name }: { value: string; onChange?: (v: string) => void; name?: string }) {
  const [val, setVal] = useState(value)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const set = (v: string) => { setVal(v); onChange?.(v) }

  async function pick(f: File | undefined) {
    if (!f) return
    setBusy(true); setErr('')
    const r = await sendPhoto(f)
    if (r.error) setErr(r.error); else if (r.url) set(r.url)
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  return (
    <div className="ad-img1">
      {name && <input type="hidden" name={name} value={val} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {val ? <img src={val} alt="" /> : <div className="ph"><Icon name="image" size={22} /></div>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <button type="button" className="btn b-ghost sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : val ? 'Change photo' : 'Upload photo'}</button>
      {val && !busy && <button type="button" className="btn b-ghost sm" onClick={() => set('')}>Remove</button>}
      {err && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{err}</span>}
    </div>
  )
}
