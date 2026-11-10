'use client'
import { useState } from 'react'

/** A large textarea with a live word count, still a plain named form field for the server action. */
export function WordCountField({ name, defaultValue, placeholder }: { name: string; defaultValue?: string; placeholder?: string }) {
  const [v, setV] = useState(defaultValue ?? '')
  const words = v.trim() ? v.trim().split(/\s+/).length : 0
  return (
    <div>
      <textarea className="inp" name={name} value={v} onChange={(e) => setV(e.target.value)} style={{ minHeight: 240 }} placeholder={placeholder} />
      <p className="hint">{words} word{words === 1 ? '' : 's'}</p>
    </div>
  )
}
