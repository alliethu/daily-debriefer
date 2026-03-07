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
    <div className="flex flex-wrap gap-2">
      {THEME_OPTIONS.map(theme => {
        const active = selected.includes(theme)
        return (
          <button
            key={theme}
            type="button"
            onClick={() => toggle(theme)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {theme}
          </button>
        )
      })}
    </div>
  )
}
