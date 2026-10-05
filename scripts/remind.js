import fs from 'node:fs'
import path from 'node:path'
import { buildRevision, sendTelegram } from './telegram.js'

const latest = JSON.parse(fs.readFileSync(path.resolve('public/data/latest.json'), 'utf8'))
await sendTelegram(buildRevision(latest))
