'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  hasEntry: boolean
  hasTheme: boolean
  hasPulse: boolean
  hasAttachment: boolean
}

const DISMISSED_KEY = 'dd:onboarding:dismissed'
const INSIGHT_KEY = 'dd:onboarding:insight'

export default function GettingStartedChecklist({ hasEntry, hasTheme, hasPulse, hasAttachment }: Props) {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash
  const [hasInsight, setHasInsight] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    setDismissed(false)
    setHasInsight(!!localStorage.getItem(INSIGHT_KEY))
  }, [])

  const items = [
    { label: 'Write your first entry',        done: hasEntry,      href: '/entry/new' },
    { label: 'Add a theme to an entry',        done: hasTheme,      href: '/entry/new' },
    { label: 'Track a relationship pulse',     done: hasPulse,      href: '/entry/new' },
    { label: 'Upload a file attachment',       done: hasAttachment, href: '/entry/new' },
    { label: 'Generate an AI insight',         done: hasInsight,    href: '/insights'  },
  ]

  const completedCount = items.filter(i => i.done).length
  const allDone = completedCount === items.length

  useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem(DISMISSED_KEY, '1')
      setDismissed(true)
    }
  }, [allDone, dismissed])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const pct = Math.round((completedCount / items.length) * 100)

  return (
    <div className="rounded-lg overflow-hidden mb-6" style={{ border: '1px solid var(--n-border)', background: 'var(--n-active)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--n-border)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-medium" style={{ color: 'var(--n-text3)', flexShrink: 0 }}>
            Getting started
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--n-border)', maxWidth: '120px' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--n-blue)' }}
            />
          </div>
          <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--n-text3)' }}>
            {completedCount} / {items.length}
          </span>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss getting started"
          className="ml-3 opacity-40 hover:opacity-100 transition-opacity text-sm flex-shrink-0"
          style={{ color: 'var(--n-text3)' }}
        >×</button>
      </div>

      {/* Items */}
      <div>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          if (item.done) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-2.5"
                style={isLast ? {} : { borderBottom: '1px solid var(--n-border)' }}
              >
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--n-blue)' }}>●</span>
                <span className="text-sm line-through" style={{ color: 'var(--n-text3)' }}>{item.label}</span>
              </div>
            )
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 group transition-colors"
              style={isLast ? {} : { borderBottom: '1px solid var(--n-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--n-text3)' }}>○</span>
              <span className="text-sm flex-1" style={{ color: 'var(--n-text2)' }}>{item.label}</span>
              <span className="text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--n-text3)' }}>→</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
