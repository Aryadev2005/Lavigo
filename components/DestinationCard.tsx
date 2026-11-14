import Image from 'next/image'
import Link from 'next/link'
import { Art } from './Art'
import { Icon } from './Icons'
import SpotlightCard from './SpotlightCard'
import { inr } from '@/lib/format'
import type { Destination } from '@/lib/types'
import './DestinationCard.css'

// One destination tile (home page, /destinations and "more destinations"). Links to the destination's own page.
export function DestinationCard({ d, cover, nights, fromPrice, hasGroupTrip, priority }: {
  d: Pick<Destination, 'slug' | 'name' | 'area' | 'theme'>
  cover: string | null
  nights: number
  fromPrice: number | null
  hasGroupTrip: boolean
  priority?: boolean
}) {
  return (
    <SpotlightCard theme="light" spotlightColor="#8A6FD1" intensity={0.5} spotlightSize={260} borderGlow={0.8} className="lv-dest" style={{ ['--spotlight-card-border' as string]: 'var(--lv-line)' }}>
      <Link href={`/destinations/${d.slug}`} className="lv-dest-in">
        <span className="lv-dest-pic">
          {cover
            ? <Image src={cover} alt={`${d.name}, ${d.area}`} fill priority={priority} sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
            : <Art theme={d.theme} h={220} variant={1} id={'d' + d.slug} />}
          <span className="lv-dest-tag">{hasGroupTrip ? 'Group trip' : 'Private trip'}</span>
        </span>
        <span className="lv-dest-body">
          <b>{d.name}</b>
          <small><Icon name="pin" size={14} />{d.area}</small>
          <span className="lv-dest-foot">
            <span>{nights} nights{fromPrice && <> · from <em>{inr(fromPrice)}</em></>}</span>
            <span className="ud-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
          </span>
        </span>
      </Link>
    </SpotlightCard>
  )
}
