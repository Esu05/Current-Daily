import { BookOpen } from 'lucide-react'

export default function Header({ date }) {
  const d = date ? new Date(date + 'T00:00:00') : null
  const day = d ? d.getDate() : ''
  const rest = d ? d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', weekday: 'long' }) : ''

  return (
    <header className="border-b border-line pb-6">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        <BookOpen size={16} />
        <span>UPSC Daily</span>
      </div>
      <div className="mt-4 flex items-end gap-4">
        <span className="font-serif text-7xl font-semibold leading-none sm:text-8xl">{day}</span>
        <span className="pb-2 font-serif text-lg text-muted sm:text-xl">{rest}</span>
      </div>
    </header>
  )
}
