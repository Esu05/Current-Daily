export default function HistoryList({ items }) {
  if (!items?.length) return null
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold">On this day</h2>
      <ul className="mt-3 divide-y divide-line">
        {items.map((h, i) => (
          <li key={i} className="flex gap-4 py-3">
            <span className="w-12 shrink-0 font-serif font-semibold text-gs1">{h.year}</span>
            <span className="font-serif text-sm leading-relaxed">{h.point}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
