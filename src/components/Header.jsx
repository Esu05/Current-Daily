import { BookOpen, Send } from 'lucide-react'

const CHANNEL_URL = 'https://t.me/Current_Daily_Reminder'

export default function Header({ date }) {
  const d = date ? new Date(date + 'T00:00:00') : null
  const day = d ? d.getDate() : ''
  const rest = d ? d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', weekday: 'long' }) : ''

  return (
    <header className="border-b border-line pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <BookOpen size={16} />
          <span>Current Daily</span>
        </div>
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-ink px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Send size={14} />
          Get daily reminders on Telegram
        </a>
      </div>
      <div className="mt-4 flex items-end gap-4">
        <span className="font-serif text-7xl font-semibold leading-none sm:text-8xl">{day}</span>
        <span className="pb-2 font-serif text-lg text-muted sm:text-xl">{rest}</span>
      </div>
    </header>
  )
}
