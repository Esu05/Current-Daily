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
  const prompt = `You are a STRICT UPSC Civil Services current-affairs editor.

Your job is NOT to collect all potentially useful news.

Your job is to select ONLY the most relevant and important news that a serious UPSC aspirant should actually revise.

Headline: ${item.title}

Summary: ${item.snippet}

--------------------------------
STEP 1 — IMPORTANCE TEST
--------------------------------

Score the news from 1 to 5.

5 = MUST KEEP
A major national or international development with strong UPSC relevance.

Examples:
- New law, Bill, constitutional development or major Supreme Court judgment
- Major government policy, flagship scheme or important reform
- Union Budget, RBI decision, major economic policy or significant trade agreement
- Major international agreement, geopolitical development or India's important diplomatic move
- Major defence/security development
- Major climate/environment treaty, policy or significant ecological development
- Major space/science/technology breakthrough involving India or strategically important technology
- Important national/international report, index, census, survey or major data release
- Major disaster or disaster-management development with national significance
- Major development directly relevant to India's agriculture, food security or farmers
- Important institutional change involving bodies such as EC, UPSC, RBI, SEBI, CAG, etc.

4 = KEEP
Clearly relevant to UPSC and useful for Mains/Prelims, but not necessarily a major national event.

Examples:
- Important government initiative
- Significant court ruling
- Important report or finding
- Important environment/wildlife development
- Significant scientific development
- Important international development affecting India
- Important economic or agricultural development
- Important social-sector development

3 = BORDERLINE
There is some UPSC relevance, but the story is not important enough to prioritize.

Examples:
- Generic explainer
- Minor policy update
- Local environmental story
- Foreign event with weak connection to India
- General background article

2 = REJECT
Weak UPSC relevance.

Examples:
- Generic lifestyle article
- Local development
- Minor business news
- Individual achievement
- Generic weather article
- Routine administrative announcement

1 = DEFINITELY REJECT
Not useful for UPSC.

Examples:
- Sports
- Entertainment
- Celebrity news
- Crime
- Accidents
- Political statements/rhetoric
- Party rallies
- Rumours
- One company's business operations
- Personal stories
- Human-interest stories without a major policy/institutional issue

--------------------------------
STEP 2 — UPSC VALUE TEST
--------------------------------

Ask:

"If I were preparing for UPSC, would I realistically make a note of this and revise it before Prelims/Mains?"

If the answer is NO, reject it.

Also ask:

"Does this news have a concrete fact, institution, policy, law, scheme, report, judgment, agreement, scientific development, environmental issue, economic decision, or constitutional significance?"

If NO, strongly prefer rejection.

--------------------------------
STEP 3 — IMPORTANCE FILTER
--------------------------------

IMPORTANT:

Do NOT keep an article merely because it can be connected to a GS subject.

For example:

Bad:
"Why air feels hotter when winds slow down"
→ Geography connection exists, but it is not important enough.

Bad:
"A tiger was spotted in a reserve"
→ Environment connection exists, but a routine wildlife story is not enough.

Bad:
"Foreign leader makes statement about India"
→ IR connection exists, but political statements alone are not enough.

Bad:
"Company launches new AI product"
→ Technology connection exists, but one company's product launch is usually not UPSC current affairs.

Good:
"India signs a major international agreement on critical minerals"
→ important IR + economy + strategic resources.

Good:
"Supreme Court rules on appointment powers of constitutional authority"
→ important Polity + Constitution + Judiciary.

Good:
"Government launches major scheme for food security"
→ important Governance + Social Justice + Economy.

--------------------------------
STEP 4 — PRIORITY ORDER
--------------------------------

When deciding between two stories, prefer them in this order:

1. Constitution / Supreme Court / Parliament
2. Major government policy or flagship scheme
3. Important national institution or constitutional body
4. Economy / Budget / RBI / taxation / trade
5. International relations / major geopolitical development affecting India
6. Environment / climate / biodiversity
7. Defence / internal security
8. Science / space / strategic technology
9. Agriculture / food security
10. Social justice / health / education / vulnerable groups
11. Important reports, indices and data
12. History/culture/geography only when there is a significant current development

--------------------------------
STEP 5 — AVOID DUPLICATES
--------------------------------

If the story is mainly repeating an already-known development, do not select it unless there is a genuinely new development.

Prefer:
"Government announces implementation of X"

over:
"Experts discuss the importance of X"

Prefer:
"Supreme Court gives judgment on X"

over:
"Experts debate the Supreme Court case"

--------------------------------
TOPIC GUIDE
--------------------------------

Polity = Constitution, Parliament, elections, judiciary, constitutional bodies.

Governance = government schemes, public administration, policy implementation.

Social Justice = welfare, health, education, vulnerable groups, poverty, inequality.

IR = foreign policy, diplomacy, treaties, international organisations, important geopolitical developments.

Economy = Budget, RBI, inflation, taxation, trade, fiscal policy, banking, major economic reforms.

Agriculture = crops, MSP, farmers, agricultural policy, food security.

Environment = ecology, wildlife, biodiversity, pollution, climate change, environmental policy.

Sci-Tech = space, AI, technology, biotechnology, scientific research, strategic technologies.

Security = defence, terrorism, cybersecurity, internal security, military developments.

Disaster = floods, cyclones, earthquakes, disaster management and resilience.

History = historical developments when relevant to UPSC.

Culture = art, heritage, archaeology, architecture, languages and important cultural developments.

Geography = monsoon, rainfall, rivers, oceans, natural resources and major geographical phenomena.

Society = tribal communities, women, population, urbanisation, migration and social change.

Ethics = integrity, public service values, accountability and ethical issues.

--------------------------------
POINT FORMAT
--------------------------------

Write "point" as a direct factual statement about what happened.

Never start it with:
"The summary"
"The article"
"The headline"
"The text"

Name the actual people, institutions, places, laws, schemes or organisations involved.

Use ONLY the headline and summary.

Do NOT add facts that are not present.

--------------------------------
FINAL DECISION
--------------------------------

Keep ONLY stories with score >= 4.

Score 3 or below = REJECT.

Be selective. It is better to return 5 genuinely important stories than 15 mediocre stories.

Return JSON in exactly this shape, with "reason" first:

{
  "reason": "one short sentence explaining why this is important for UPSC",
  "score": 4,
  "topic": "one topic from the guide",
  "point": "one clear factual sentence",
  "whyInNews": "one short sentence explaining the immediate context"
}`;

  const out = await askJson(prompt);

  
  if (Number(out.score) < 4) return null;

  const topic = normalizeTopic(out.topic);

  if (!topic || typeof out.point !== 'string' || !out.point.trim()) {
    return null;
  }

  if (
    /^(the\s+)?(summary|article|headline|text|rescue act)\b/i.test(
      out.point.trim()
    )
  ) {
    return null;
  }

  return {
    point: out.point.trim(),
    whyInNews: String(out.whyInNews || '').trim(),
    gs: TOPIC_GS[topic],
    topic,
    source: item.source,
    url: item.url,
  };
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
Pick up to 10 that are useful for GS1: Indian history, the freedom struggle, world history, wars and treaties, constitutional or political milestones, independence and revolutions, science milestones, important institutions.
Skip entertainment, music, films, sport, newspapers, personal appointments, quotes and any minor event not tied to a larger historical theme.
Prefer events that changed a country or the world.
Return JSON in exactly this shape: {"picks":[1,2,3]}

EVENTS:
${list}`
  const out = await askJson(prompt)
  const byId = new Map(events.map((e) => [e.id, e]))
  const seen = new Set()
  return (out.picks || [])
    .map((n) => byId.get(Number(n)))
    .filter((e) => e && !seen.has(e.id) && seen.add(e.id))
    .slice(0, 10)
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

  const news = await fetchNews()
  if (news.length === 0) throw new Error('No news fetched, keeping previous data')

  let events = []
  try {
    events = await fetchHistory(m, d)
  } catch (e) {
    console.warn('History fetch failed, continuing without it:', e.message)
  }

  const currentAffairs = await pickNews(news)
  if (currentAffairs.length === 0) throw new Error('Model selected nothing, keeping previous data')

    let history = []
  if (events.length > 0) {
    try {
      history = await pickHistory(events)
    } catch (e) {
      console.warn('History selection failed, continuing without it:', e.message)
    }
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