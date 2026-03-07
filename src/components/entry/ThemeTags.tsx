'use client'

import { THEME_OPTIONS } from '@/lib/types'

interface Props {
  selected: string[]
  onChange: (themes: string[]) => void
}

export default function ThemeTags({ selected, onChange }: Props) {
  function toggle(theme: string) {
    if (selected.includes(theme)) {
      onChange(selected.filter(t => t !== theme))
    } else {
      onChange([...selected, theme])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {THEME_OPTIONS.map(theme => {
        const active = selected.includes(theme)
        return (
          <button key={theme} type="button" onClick={() => toggle(theme)}
            aria-pressed={active}
            className="rounded-sm px-2 py-1 text-xs transition-colors"
            style={{
              background: active ? 'rgba(26,111,196,0.15)' : 'var(--n-active)',
              color: active ? 'var(--n-blue)' : 'var(--n-text2)',
              border: active ? '1px solid rgba(26,111,196,0.3)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text)' } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text2)' } }}
          >
            {theme}
          </button>
        )
      })}
    </div>
  )
}
