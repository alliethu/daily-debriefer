'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  ariaLabel?: string
  style?: React.CSSProperties
}

export default function PersonNameInput({ value, onChange, onSubmit, placeholder = 'Name...', ariaLabel = "Person's name", style }: Props) {
  const [names, setNames] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('people').select('name').order('name').then(({ data }) => {
      setNames((data ?? []).map(p => p.name))
    })
  }, [])

  const filtered = value.trim()
    ? names.filter(n => n.toLowerCase().includes(value.toLowerCase()))
    : []

  const visible = showDropdown && filtered.length > 0

  function select(name: string) {
    onChange(name)
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (visible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        select(filtered[activeIndex])
        return
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div ref={containerRef} className="relative" style={{ flex: 1, minWidth: 0 }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setShowDropdown(true); setActiveIndex(-1) }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => { setTimeout(() => setShowDropdown(false), 150) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--n-border)',
          borderRadius: '4px',
          padding: '6px 10px',
          fontSize: '14px',
          color: 'var(--n-text)',
          outline: 'none',
          width: '100%',
          ...style,
        }}
        onFocusCapture={e => { e.target.style.borderColor = 'var(--n-blue)' }}
        onBlurCapture={e => { e.target.style.borderColor = 'var(--n-border)' }}
      />
      {visible && (
        <div
          className="absolute left-0 right-0 z-20 mt-1 rounded overflow-hidden"
          style={{ background: 'var(--n-sidebar)', border: '1px solid var(--n-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          {filtered.slice(0, 6).map((name, i) => (
            <button
              key={name}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(name) }}
              className="w-full text-left px-3 py-1.5 text-sm transition-colors"
              style={{
                color: 'var(--n-text2)',
                background: i === activeIndex ? 'var(--n-hover)' : 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i === activeIndex ? 'var(--n-hover)' : 'transparent' }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
