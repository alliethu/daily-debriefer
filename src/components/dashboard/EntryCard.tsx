'use client'

import Link from 'next/link'
import { type Entry } from '@/lib/types'
import { stripHtml } from '@/lib/html'

const sentimentDot: Record<string, string> = {
  positive: '#4caf50',
  neutral:  '#9b9b9b',
  tense:    '#ff9800',
}

const energyEmoji = ['', '😔', '😐', '🙂', '😊', '⚡']

interface Props {
  entry: Entry & {
    relationship_pulses?: { person_name: string; sentiment: string }[]
    entry_themes?: { theme: string }[]
  }
}

export default function EntryCard({ entry }: Props) {
  const date = new Date(entry.date + 'T12:00:00')
  const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <Link href={`/entry/${entry.id}`} className="group block py-2.5 px-2 rounded transition-colors"
      style={{ color: 'inherit', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5 flex-shrink-0">📝</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>
              {formatted}
            </span>
            {entry.is_quick_win && (
              <span className="text-xs rounded-sm px-1.5 py-0.5 font-medium"
                style={{ background: 'rgba(26,111,196,0.15)', color: 'var(--n-blue)' }}>
                ⚡ win
              </span>
            )}
            {entry.entry_themes?.slice(0, 3).map((t, i) => (
              <span key={i} className="text-xs rounded-sm px-1.5 py-0.5"
                style={{ background: 'var(--n-active)', color: 'var(--n-text3)' }}>
                {t.theme}
              </span>
            ))}
          </div>
          <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--n-text2)' }}>
            {stripHtml(entry.what_i_did) || <span style={{ color: 'var(--n-text3)', fontStyle: 'italic' }}>No content</span>}
          </p>
          {(entry.relationship_pulses?.length || 0) > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              {entry.relationship_pulses!.map((p, i) => (
                <span key={i} className="flex items-center gap-1 text-xs" style={{ color: 'var(--n-text3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{ background: sentimentDot[p.sentiment] ?? '#9b9b9b' }} />
                  {p.person_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-sm" title={`Energy ${entry.energy_level}/5`}>{energyEmoji[entry.energy_level]}</span>
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--n-text3)' }}>→</span>
        </div>
      </div>
    </Link>
  )
}
