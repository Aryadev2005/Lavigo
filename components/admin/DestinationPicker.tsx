'use client'
import { useState } from 'react'

/** Destination dropdown with a "new place" option, so a trip to somewhere new can be added in one go. */
export function DestinationPicker({ options, value }: { options: { id: string; name: string }[]; value: string }) {
  const [v, setV] = useState(value)
  return (
    <>
      <select id="t-dest" className="inp" name="destination_id" value={v} onChange={(e) => setV(e.target.value)}>
        <option value="">None</option>
        {options.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        <option value="new">+ A new destination…</option>
      </select>
      {v === 'new' ? (
        <div className="ad-newdest">
          <input className="inp" name="new_destination" placeholder="Name, e.g. Meghalaya" required minLength={2} maxLength={60} />
          <input className="inp" name="new_destination_area" placeholder="Area, e.g. Shillong · Cherrapunji" maxLength={80} />
          <p className="hint">Created when you save. Add its photos in the Photos section below.</p>
        </div>
      ) : <p className="hint">Its hotels, cars and photos appear on the trip page unless you set the trip&apos;s own below.</p>}
    </>
  )
}
