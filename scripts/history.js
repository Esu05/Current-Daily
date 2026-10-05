
const BLOCK = /crash|suicide|bomb|massacre|shooting|murder|hijack|collision|stabbing|earthquake|hurricane|typhoon|sinks|meltdown|cult|\bfire\b/i

export async function fetchHistory(month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`
  const res = await fetch(url, { headers: { 'User-Agent': 'upsc-daily/1.0 (github.com/Esu05)' } })
  if (!res.ok) throw new Error(`History API failed: ${res.status}`)
  const data = await res.json()

  const all = [...(data.selected || []), ...(data.events || [])]
  const seen = new Set()
  const out = []
  for (const e of all) {
    if (!e.year || !e.text || BLOCK.test(e.text)) continue
    const key = `${e.year}-${e.text}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ year: e.year, text: e.text.slice(0, 200) })
  }
  return out.slice(0, 50).map((e, i) => ({ id: i + 1, ...e }))
}
