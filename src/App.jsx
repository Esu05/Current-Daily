import { useMemo, useState } from 'react'
import useDailyData from './hooks/useDailyData'
import Header from './components/Header'
import GsFilter from './components/GsFilter'
import AffairCard from './components/AffairCard'
import HistoryList from './components/HistoryList'
import RevisionPanel from './components/RevisionPanel'

export default function App() {
  const { data, error } = useDailyData()
  const [gs, setGs] = useState('All')

  const affairs = useMemo(() => {
    if (!data) return []
    return gs === 'All' ? data.currentAffairs : data.currentAffairs.filter((a) => a.gs === gs)
  }, [data, gs])

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <Header date={data?.date} />

      {error && <p className="mt-8 text-muted">{error}</p>}
      {!data && !error && <p className="mt-8 text-muted">Loading today's pack...</p>}

      {data && (
        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <GsFilter value={gs} onChange={setGs} items={data.currentAffairs} />
            <div className="mt-4">
              {affairs.map((a, i) => (
                <AffairCard key={i} item={a} />
              ))}
            </div>
          </div>
          <aside className="space-y-10">
            <HistoryList items={data.history} />
            <RevisionPanel items={data.revision} />
          </aside>
        </div>
      )}

      <footer className="mt-16 border-t border-line pt-4 text-sm text-muted">
        Summaries are made by an open model and can be wrong. Check the source link before relying on a point.
      </footer>
    </main>
  )
}