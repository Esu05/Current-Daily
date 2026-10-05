import { ExternalLink } from 'lucide-react'

const GS_COLOR = {
  GS1: 'var(--color-gs1)',
  GS2: 'var(--color-gs2)',
  GS3: 'var(--color-gs3)',
  GS4: 'var(--color-gs4)',
}

export default function AffairCard({ item }) {
  const color = GS_COLOR[item.gs] || 'var(--color-muted)'

  return (
    <article className="border-b border-line py-6 pl-5" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold" style={{ color }}>{item.gs}</span>
        <span className="text-muted">{item.topic}</span>
      </div>
      <h2 className="mt-2 font-serif text-xl font-medium leading-snug">{item.point}</h2>
      {item.whyInNews && (
        <p className="mt-2 max-w-prose font-serif leading-relaxed text-muted">{item.whyInNews}</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {item.source}
          <ExternalLink size={14} />
        </a>
      )}
    </article>
  )
}