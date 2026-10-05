import fs from 'node:fs'
import path from 'node:path'
import { fetchNews } from './feeds.js'
import { fetchHistory } from './history.js'
import { askJson } from './llm.js'
import { buildDigest, sendTelegram } from './telegram.js'

const DATA_DIR = path.resolve('public/data')
const MAX_POINTS = 15

const TOPIC_GS = {
  Polity: 'GS2',
  Governance: 'GS2',
  'Social Justice': 'GS2',
  IR: 'GS2',
  Economy: 'GS3',
  Agriculture: 'GS3',
  Environment: 'GS3',
  'Sci-Tech': 'GS3',
  Security: 'GS3',
  Disaster: 'GS3',
  History: 'GS1',
  Culture: 'GS1',
  Geography: 'GS1',
  Society: 'GS1',
  Ethics: 'GS4',
}

const istDate = (offsetDays = 0) =>
  new Date(Date.now() - offsetDays * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

function normalizeTopic(raw) {
  const t = String(raw || '').toLowerCase().trim()
  return Object.keys(TOPIC_GS).find((k) => t === k.toLowerCase() || t.includes(k.toLowerCase())) || null
}

async function screenItem(item) {
  const prompt = `You are screening news for a UPSC Civil Services aspirant. Be fair: keep anything an aspirant could use in answers or revision.

Headline: ${item.title}
Summary: ${item.snippet}

Score 1 to 5 for UPSC usefulness:
5 = a national policy, law, Constitution or Parliament matter, an important court judgment, a government scheme, a major economic decision, an international agreement, an important report, a space or defence development.
4 = a clear link to governance, the economy, environment, science, international relations or a major social issue.
3 = useful background on one of those topics, such as an explainer, an editorial, an environment or wildlife story, a development news piece, or a foreign event that matters to India.
2 = a weak link only.
1 = no link: city or local news, one state's party politics, crime, accidents, sports, entertainment, lifestyle, rumours, or one person's story.

Examples:
"Can Singapore turn doomscrollers into doomreaders?" is 1 (lifestyle commentary).
"Rumours about a leader's health" is 1 (rumour roundup).
"Captain X's courage, and a question for aviation" is 2 (one person's story).
"Co-pilot accused of hijack attempt" is 1 (crime).
"Company hikes petrol price" is 1 (one company).
"GST exemption for banks on gold imports" is 5.
"How the Election Commission is appointed, explained" is 5.
"Tiger reintroduction in a reserve" is 3 (environment).
"Quantum link demonstrated by Indian scientists" is 4.

Topic guide, pick the closest one:
Polity = Constitution, Parliament, elections, judiciary.
Governance = government schemes, policy, administration.
Social Justice = welfare, health, education, vulnerable groups.
IR = foreign policy, treaties, other countries.
Economy = budget, RBI, trade, tax, markets.
Agriculture = crops, MSP, farmers.
Environment = ecology, wildlife, pollution, climate change.
Sci-Tech = space, technology, research.
Security = defence, terrorism, internal security.
Disaster = floods, cyclones, disaster management.
History = historical events or figures.
Culture = art, heritage, religion, festivals, languages.
Geography = monsoon, rainfall, rivers, oceans, natural resources, regions.
Society = tribal communities, women, population, urbanisation, migration.
Ethics = integrity, public service values, moral dilemmas.

Use only the headline and summary. Do not add facts.
Return JSON in exactly this shape, with "reason" first:
{"reason":"one short sentence","score":3,"topic":"one word from the guide","point":"one clear sentence","whyInNews":"one short sentence of context"}`

  const out = await askJson(prompt)
  if (Number(out.score) < 3) return null
  const topic = normalizeTopic(out.topic)
  if (!topic || typeof out.point !== 'string' || !out.point.trim()) return null

  return {
    point: out.point.trim(),
    whyInNews: String(out.whyInNews || '').trim(),
    gs: TOPIC_GS[topic],
    topic,
    source: item.source,
    url: item.url, // always from the feed item that was screened, so it can never mismatch
  }
}

async function pickNews(items) {
  const picked = []
  for (let i = 0; i < items.length && picked.length < MAX_POINTS; i++) {
    console.log(`[${i + 1}/${items.length}] ${items[i].title.slice(0, 70)}`)
    try {
      const r = await screenItem(items[i])
      if (r) {
        picked.push(r)
        console.log('   kept')
      }
    } catch (e) {
      console.warn('   skipped:', e.message)
    }
  }
  return picked
}

async function pickHistory(events) {
  const list = events.map((e) => `${e.id}. ${e.year}: ${e.text}`).join('\n')
  const prompt = `You are helping a UPSC Civil Services aspirant. Below are historical events for today's date.
Pick up to 6 that are useful for GS1: Indian history, the freedom struggle, world history, treaties, constitutional or political milestones, science milestones, important institutions.
Skip trivia, minor events and anything not tied to a larger historical theme.
Return JSON in exactly this shape: {"picks":[1,2,3]}

EVENTS:
${list}`
  const out = await askJson(prompt)
  const byId = new Map(events.map((e) => [e.id, e]))
  return (out.picks || [])
    .map((n) => byId.get(Number(n)))
    .filter(Boolean)
    .slice(0, 6)
    .map((e) => ({ year: e.year, point: e.text, gs: 'GS1' }))
}

function loadRevision() {
  const out = []
  for (const back of [1, 2]) {
    const f = path.join(DATA_DIR, `${istDate(back)}.json`)
    if (!fs.existsSync(f)) continue
    const j = JSON.parse(fs.readFileSync(f, 'utf8'))
    out.push(...j.currentAffairs.slice(0, 3).map((a) => a.point))
  }
  return out
}

async function main() {
  const date = istDate()
  const [, m, d] = date.split('-').map(Number)

  const [news, events] = await Promise.all([fetchNews(), fetchHistory(m, d)])
  if (news.length === 0) throw new Error('No news fetched, keeping previous data')

  const currentAffairs = await pickNews(news)
  if (currentAffairs.length === 0) throw new Error('Model selected nothing, keeping previous data')

  let history = []
  try {
    history = await pickHistory(events)
  } catch (e) {
    console.warn('History selection failed, continuing without it:', e.message)
  }

  const pack = { date, currentAffairs, history, revision: loadRevision() }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, `${date}.json`), JSON.stringify(pack, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, 'latest.json'), JSON.stringify(pack, null, 2))
  console.log(`Wrote pack for ${date}: ${currentAffairs.length} points, ${history.length} history`)

  await sendTelegram(buildDigest(pack))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})