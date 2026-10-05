import { useEffect, useState } from 'react'

export default function useDailyData() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data/latest.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('missing')
        return r.json()
      })
      .then(setData)
      .catch(() => setError("Could not load today's pack. Refresh in a few minutes."))
  }, [])

  return { data, error }
}
