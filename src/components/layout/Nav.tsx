'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Journal', icon: '◈' },
  { href: '/entry/new', label: 'New entry', icon: '+' },
  { href: '/insights', label: 'Insights', icon: '◇' },
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-52 bg-neutral-950 border-r border-neutral-900 py-8 px-4 z-10">
        <div className="mb-8 px-2">
          <span className="text-indigo-400 text-lg">◆</span>
          <span className="ml-2 text-sm font-medium text-neutral-300">Daily Debriefer</span>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(link => {
            const active = link.href === '/entry/new'
              ? pathname === '/entry/new'
              : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-neutral-900 text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                }`}
              >
                <span className="text-base leading-none">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:text-neutral-400 transition-colors w-full"
        >
          <span>↩</span>
          Sign out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-900 flex z-10">
        {links.map(link => {
          const active = link.href === '/entry/new'
            ? pathname === '/entry/new'
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? 'text-indigo-400' : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          <span className="text-base">↩</span>
          Out
        </button>
      </nav>
    </>
  )
}
