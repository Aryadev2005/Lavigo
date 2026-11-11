import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Footer } from '@/components/Footer'
import { FooterGate } from '@/components/FooterGate'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { SmoothScroll } from '@/components/Lenis'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getSite } from '@/lib/site'
import 'lenis/dist/lenis.css'
import './globals.css'
import './mmt.css'
import './lavigo.css'
import './premium.css'
import './theme.css'

// Body text is Plus Jakarta Sans. It keeps the old --font-outfit variable name so every existing rule picks it up.
const outfit = localFont({ src: './fonts/jakarta-latin.woff2', variable: '--font-outfit', display: 'swap', weight: '200 800' })
// Display serif. The weight range is capped at 600 so headings stay elegant even where older CSS asks for 800-900.
const fraunces = localFont({
  src: [
    { path: './fonts/fraunces-latin.woff2', weight: '300 600', style: 'normal' },
    { path: './fonts/fraunces-latin-italic.woff2', weight: '300 600', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
})
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
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F4EEFD' }

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { home, business } = await getSite()
  const ld = { ...agency, sameAs: [business.instagram], ...(business.email ? { email: business.email } : {}), ...(business.gstin ? { taxID: business.gstin } : {}) }
  return (
    <html lang="en-IN" className={`${outfit.variable} ${italiana.variable} ${fraunces.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <JsonLd data={ld} />
        <SmoothScroll />
        <Header topbar={home.topbar} instagram={business.instagram} />
        <main id="main">{children}</main>
        <FooterGate><Footer /></FooterGate>
        <WhatsAppFab />
      </body>
    </html>
  )
}
