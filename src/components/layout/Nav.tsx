'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Journal',  icon: '📋' },
  { href: '/entry/new', label: 'New entry', icon: '✏️' },
  { href: '/insights',  label: 'Insights',  icon: '✨' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 py-3 z-10"
        style={{ background: 'var(--n-sidebar)', borderRight: '1px solid var(--n-border)' }}
      >
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 rounded px-2 py-1.5" style={{ color: 'var(--n-text)' }}>
            <div className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: 'var(--n-blue)', color: '#fff' }}>D</div>
            <span className="text-sm font-medium truncate">Daily Debriefer</span>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-px">
          {links.map(link => {
            const active = link.href === '/entry/new'
              ? pathname === '/entry/new'
              : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2 rounded px-2 py-[5px] text-sm transition-colors"
                style={{ color: active ? 'var(--n-text)' : 'var(--n-text2)', background: active ? 'var(--n-active)' : 'transparent' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span className="text-base w-5 text-center leading-none">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pt-2" style={{ borderTop: '1px solid var(--n-border)' }}>
          <button onClick={signOut}
            className="flex items-center gap-2 rounded px-2 py-[5px] text-sm w-full transition-colors"
            style={{ color: 'var(--n-text3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text3)' }}
          >
            <span className="text-base w-5 text-center leading-none">↩</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex z-10"
        style={{ background: 'var(--n-sidebar)', borderTop: '1px solid var(--n-border)' }}>
        {links.map(link => {
          const active = link.href === '/entry/new' ? pathname === '/entry/new' : pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors"
              style={{ color: active ? 'var(--n-blue)' : 'var(--n-text3)' }}>
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
        <button onClick={signOut} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs" style={{ color: 'var(--n-text3)' }}>
          <span className="text-base">↩</span>
          <span>Out</span>
        </button>
      </nav>
    </>
  )
}
