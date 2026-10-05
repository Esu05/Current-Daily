
const BLOCK =
  /crash|suicide|bomb|massacre|shooting|murder|hijack|collision|stabbing|earthquake|hurricane|typhoon|sinks|meltdown|cult|\bfire\b|\bfilms?\b|album|\bsingle\b|\bsong\b|video game|newspaper|football|cricket|Olympic|Eurovision/i

const pad = (n) => String(n).padStart(2, '0')


function clean(text) {
  const s = text.replace(/\s*\(pictured[^)]*\)/gi, '').replace(/\s+/g, ' ').trim()
  if (s.length <= 220) return s
  const cut = s.slice(0, 220)
  return cut.slice(0, cut.lastIndexOf(' ')) + '...'
}

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

  
  const all = [...(data.events || []), ...(data.selected || [])]
  const seen = new Set()
  const out = []
  for (const e of all) {
    if (!e.year || !e.text || BLOCK.test(e.text)) continue
    const text = clean(e.text)
    const key = `${e.year}-${text.slice(0, 40)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ year: e.year, text })
  }
  return out.slice(0, 50).map((e, i) => ({ id: i + 1, ...e }))
}