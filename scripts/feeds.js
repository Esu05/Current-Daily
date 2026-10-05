import Parser from 'rss-parser'

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'upsc-daily/1.0' } })


const FEEDS = [
  { source: 'PIB', url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3' },
  { source: 'Indian Express', url: 'https://indianexpress.com/section/explained/feed/' },
  { source: 'Indian Express', url: 'https://indianexpress.com/section/opinion/editorials/feed/' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/news/international/feeder/default.rss' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/business/Economy/feeder/default.rss' },
  { source: 'BusinessLine', url: 'https://www.thehindubusinessline.com/economy/feeder/default.rss' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss' },
  { source: 'Indian Express', url: 'https://indianexpress.com/section/india/feed/' },
  { source: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
]


const SKIP_URL =
  /\/news\/cities\/|\/news\/national\/(karnataka|kerala|telangana|andhra-pradesh|tamil-nadu|other-states)\/|\/sport\/|\/entertainment\//i

const SKIP_TITLE =
  /\b(arrests?|arrested|bribery|accused|murder|killed|hijack\w*|rumou?rs?|doomscroll\w*|courage|hero)\b|hikes (petrol|diesel)|Snapshots|This Week|Jane Eyre/i

export async function fetchNews() {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const feed = await parser.parseURL(f.url)
      return feed.items.slice(0, 15).map((i) => ({
        source: f.source,
        title: (i.title || '').trim(),
        snippet: (i.contentSnippet || '').replace(/\s+/g, ' ').slice(0, 250),
        url: i.link,
      }))
    })
  )

  const lists = results.map((r, idx) => {
    if (r.status !== 'fulfilled') {
      console.warn(`Feed failed (${FEEDS[idx].url}):`, r.reason?.message)
      return []
    }
    console.log(`Feed ok: ${FEEDS[idx].source} (${r.value.length} items)`)
    return r.value
  })

 
  const seen = new Set()
  const items = []
  for (let i = 0; i < 15; i++) {
    for (const list of lists) {
      const it = list[i]
      if (!it || !it.title || !it.url || SKIP_URL.test(it.url)) continue
      if (/[\u0900-\u097F]/.test(it.title)) continue 
      if (SKIP_TITLE.test(it.title)) continue
      const key = it.title.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      items.push(it)
    }
  }
  return items.slice(0, 40).map((it, i) => ({ id: i + 1, ...it }))
}