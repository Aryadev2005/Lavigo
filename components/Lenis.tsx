'use client'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Smooth scrolling on the public site. Off for the admin console and for people who prefer reduced motion.
export function SmoothScroll() {
  const admin = usePathname().startsWith('/admin')
  useEffect(() => {
    if (admin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ anchors: true })
    let id = requestAnimationFrame(function raf(t) { lenis.raf(t); id = requestAnimationFrame(raf) })
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [admin])
  return null
}
