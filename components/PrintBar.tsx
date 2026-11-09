'use client'
import { useEffect } from 'react'
import { Icon } from './Icons'

/** Toolbar above a printable page. Opening the page with ?dl=1 starts the save-as-PDF dialog straight away. */
export function PrintBar({ backHref, fileName }: { backHref: string; fileName: string }) {
  useEffect(() => {
    const prev = document.title
    document.title = fileName // browsers use the title as the PDF file name
    let t: ReturnType<typeof setTimeout> | undefined
    if (new URLSearchParams(window.location.search).get('dl') === '1') {
      t = setTimeout(() => { document.fonts?.ready.then(() => window.print()).catch(() => window.print()) }, 400)
    }
    return () => { document.title = prev; if (t) clearTimeout(t) }
  }, [fileName])

  return (
    <div className="it-bar">
      <a href={backHref} className="it-back">← Back</a>
      <span className="it-hint">Choose <b>Save as PDF</b> in the print window to download.</span>
      <button type="button" className="it-dl" onClick={() => window.print()}><Icon name="download" size={18} />Download PDF</button>
    </div>
  )
}
