// Skip disasters and attacks. They are not useful for GS1.
const BLOCK = /crash|suicide|bomb|massacre|shooting|murder|hijack|collision|stabbing|earthquake|hurricane|typhoon|sinks|meltdown|cult|\bfire\b/i

const pad = (n) => String(n).padStart(2, '0')

async function get(type, month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/${type}/${pad(month)}/${pad(day)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'upsc-daily/1.0 (github.com/Esu05)' } })
  if (!res.ok) throw new Error(`History API (${type}) failed: ${res.status}`)
  return res.json()
}

export async function fetchHistory(month, day) {
  let data
  try {
    data = await get('all', month, day)
  } catch (e) {
    console.warn(e.message, '- trying events only')
    data = await get('events', month, day)
  }

  // "selected" is Wikipedia's curated list, so it comes first
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