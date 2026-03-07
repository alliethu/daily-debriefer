import Link from 'next/link'
import { type Entry } from '@/lib/types'

const sentimentDot: Record<string, string> = {
  positive: 'bg-emerald-400',
  neutral: 'bg-neutral-500',
  tense: 'bg-amber-400',
}

const energyBar = ['', '▁', '▂', '▄', '▆', '█']

interface Props {
  entry: Entry & {
    relationship_pulses?: { person_name: string; sentiment: string }[]
    entry_themes?: { theme: string }[]
  }
}

export default function EntryCard({ entry }: Props) {
  const date = new Date(entry.date + 'T12:00:00')
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/entry/${entry.id}`}
      className="block rounded-xl border border-neutral-800/60 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900/30 transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">{formatted}</span>
            {entry.is_quick_win && (
              <span className="text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-900/50 rounded-full px-2 py-0.5">
                win
              </span>
            )}
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed line-clamp-2">
            {entry.what_i_did || <span className="text-neutral-600 italic">No content</span>}
          </p>

          {entry.impact && (
            <p className="text-xs text-neutral-500 line-clamp-1">
              ↳ {entry.impact}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            {/* Energy */}
            <span className="text-xs text-neutral-600">
              Energy <span className="text-indigo-400">{energyBar[entry.energy_level]}</span>
            </span>

            {/* Pulses */}
            {entry.relationship_pulses && entry.relationship_pulses.length > 0 && (
              <div className="flex items-center gap-1">
                {entry.relationship_pulses.map((p, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${sentimentDot[p.sentiment] ?? 'bg-neutral-500'}`}
                    title={`${p.person_name} — ${p.sentiment}`}
                  />
                ))}
              </div>
            )}

            {/* Themes */}
            {entry.entry_themes && entry.entry_themes.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {entry.entry_themes.slice(0, 3).map((t, i) => (
                  <span key={i} className="text-xs text-neutral-600">
                    {i > 0 && '·'} {t.theme}
                  </span>
                ))}
                {entry.entry_themes.length > 3 && (
                  <span className="text-xs text-neutral-700">+{entry.entry_themes.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <span className="text-neutral-700 group-hover:text-neutral-500 transition-colors text-sm flex-shrink-0">→</span>
      </div>
    </Link>
  )
}
