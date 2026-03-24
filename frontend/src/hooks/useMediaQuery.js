import { useState, useEffect } from 'react'

/**
 * Returns true while the media query matches.
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 640px)')
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
