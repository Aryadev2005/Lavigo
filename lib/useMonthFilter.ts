'use client'
import { useCallback, useEffect, useState } from 'react'
import { isMonthKey } from './months'

/** The selected ?month=YYYY-MM chip, kept in sync with the URL so the choice can be shared and the back button works. */
export function useMonthFilter(): [string | null, (key: string | null) => void] {
  const [month, setMonthState] = useState<string | null>(null)
  useEffect(() => {
    const read = () => {
      const m = new URLSearchParams(window.location.search).get('month')
      setMonthState(isMonthKey(m) ? m : null)
    }
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])
  const setMonth = useCallback((key: string | null) => {
    setMonthState(key)
    const url = new URL(window.location.href)
    if (key) url.searchParams.set('month', key)
    else url.searchParams.delete('month')
    window.history.pushState(null, '', url)
  }, [])
  return [month, setMonth]
}
