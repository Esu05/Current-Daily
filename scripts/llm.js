import { fetch, Agent } from 'undici'

const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b'


const dispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 })

export async function askJson(prompt) {
  for (let attempt = 0; attempt < 2; attempt++) {
    console.log(`Asking ${MODEL} (attempt ${attempt + 1}), this can take a few minutes...`)
    const res = await fetch(`${HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      dispatcher,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        keep_alive: '30m',
        options: { temperature: 0, num_ctx: 8192, num_predict: 400, repeat_penalty: 1.15 },
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    try {
      return JSON.parse(data.message.content)
    } catch {
      console.warn('Model returned invalid JSON, retrying')
    }
  }
  throw new Error('Model failed to return valid JSON')
}