const PAPERS = ['GS1', 'GS2', 'GS3', 'GS4']

export default function GsFilter({ value, onChange, items }) {
  const counts = Object.fromEntries(PAPERS.map((p) => [p, items.filter((i) => i.gs === p).length]))
  const options = [
    { key: 'All', label: `All ${items.length}` },
    ...PAPERS.filter((p) => counts[p] > 0).map((p) => ({ key: p, label: `${p} ${counts[p]}` })),
  ]

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by GS paper">
      {options.map((o) => (
        <button
          key={o.key}
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            value === o.key
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-transparent text-muted hover:border-ink hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}