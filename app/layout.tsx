import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Footer } from '@/components/Footer'
import { FooterGate } from '@/components/FooterGate'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { BUSINESS, SITE_URL } from '@/lib/config'
import './globals.css'
import './mmt.css'
import './lavigo.css'

const outfit = localFont({ src: './fonts/outfit-latin.woff2', variable: '--font-outfit', display: 'swap', weight: '100 900' })
const archivo = localFont({ src: './fonts/archivo-latin.woff2', variable: '--font-archivo', display: 'swap', weight: '100 900' })
const italiana = localFont({ src: './fonts/italiana.woff2', variable: '--font-italiana', display: 'swap', weight: '400' })

const indexable = process.env.ALLOW_INDEXING === 'true' // flip to true on launch day

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Lavigo Travel Co. · Group & custom trips from anywhere in India', template: '%s | Lavigo Travel Co.' },
  description: 'Group trips and custom holidays from anywhere in India to Nepal, Darjeeling, Sikkim, Netarhat, Puri and Goa. Fixed departures with a trip leader, hotels and cars listed, downloadable itineraries, bookings on WhatsApp.',
  applicationName: 'Lavigo Travel Co.',
  openGraph: { type: 'website', siteName: 'Lavigo Travel Co.', locale: 'en_IN', url: SITE_URL, images: [{ url: '/img/trip-nepal.webp', width: 1600, height: 1068, alt: 'Lavigo Travel Co. group trips' }] },
  twitter: { card: 'summary_large_image' },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: '/' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#221944' }

const agency = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  '@id': `${SITE_URL}/#agency`,
  name: BUSINESS.name,
  url: SITE_URL,
  logo: `${SITE_URL}/img/logo.webp`,
  image: `${SITE_URL}/img/trip-nepal.webp`,
  telephone: BUSINESS.phoneE164,
  description: 'Group and custom trips for travellers from anywhere in India to Nepal, Darjeeling, Sikkim, Netarhat, Puri and Goa. Office in Ranchi, Jharkhand.',
  address: { '@type': 'PostalAddress', streetAddress: 'Ground Floor, Amit Complex, Near Oxford Public School, Chutia, Samlong', addressLocality: BUSINESS.city, addressRegion: BUSINESS.region, addressCountry: BUSINESS.country },
  areaServed: { '@type': 'Country', name: 'India' },
  sameAs: [BUSINESS.instagram],
  priceRange: '₹₹',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${outfit.variable} ${italiana.variable} ${archivo.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <JsonLd data={agency} />
        <Header />
        <main id="main">{children}</main>
        <FooterGate><Footer /></FooterGate>
      </body>
    </html>
  )
}
