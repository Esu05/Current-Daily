import { RotateCcw } from 'lucide-react'

export default function RevisionPanel({ items }) {
  if (!items?.length) return null
  return (
    <section>
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <RotateCcw size={18} />
        Revise from earlier
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((p, i) => (
          <li key={i} className="font-serif text-sm leading-relaxed text-muted">{p}</li>
        ))}
      </ul>
    </section>
  )
}
