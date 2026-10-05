export async function fetchHistory(month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`
  const res = await fetch(url, { headers: { 'User-Agent': 'upsc-daily/1.0 (github.com/Esu05)' } })
  if (!res.ok) throw new Error(`History API failed: ${res.status}`)
  const data = await res.json()
  return (data.events || [])
    .filter((e) => e.year && e.text)
    .slice(0, 60)
    .map((e, i) => ({ id: i + 1, year: e.year, text: e.text.slice(0, 200) }))
}
