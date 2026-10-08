import fs from 'node:fs'
import path from 'node:path'

import { buildRevision, sendTelegram } from './telegram.js'

const now = new Date()

const indiaTime = now.toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'long'
})

console.log(`Workflow started at: ${indiaTime}`)

const latest = JSON.parse(
  fs.readFileSync(
    path.resolve('public/data/latest.json'),
    'utf8'
  )
)

await sendTelegram(buildRevision(latest))