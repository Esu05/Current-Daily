const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildDigest(d) {
  const lines = [`<b>UPSC Daily: ${d.date}</b>`, '', '<b>Current affairs</b>']
  d.currentAffairs.forEach((a, i) => lines.push(`${i + 1}. [${esc(a.gs)}] ${esc(a.point)}`))
  lines.push('', '<b>On this day</b>')
  d.history.forEach((h) => lines.push(`${h.year}: ${esc(h.point)}`))
  return lines.join('\n').slice(0, 4000)
}

export function buildRevision(d) {
  const pts = d.revision?.length ? d.revision : d.currentAffairs.slice(0, 3).map((a) => a.point)
  return ['<b>Evening revision</b>', '', ...pts.map((p) => `- ${esc(p)}`)].join('\n').slice(0, 4000)
}

export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) {
    console.log('Telegram not configured, skipping send')
    return
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!res.ok) console.warn('Telegram send failed:', res.status, await res.text())
}
