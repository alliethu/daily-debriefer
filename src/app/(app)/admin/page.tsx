export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const { data: usersData } = await admin.auth.admin.listUsers()
  const users = usersData?.users ?? []

  const { data: allEntries } = await admin
    .from('entries')
    .select('user_id, date')

  const { data: allInsights } = await admin
    .from('saved_insights')
    .select('user_id')

  // Aggregate entry stats per user
  const entryMap = new Map<string, { count: number; lastDate: string | null }>()
  for (const row of allEntries ?? []) {
    const existing = entryMap.get(row.user_id)
    if (!existing) {
      entryMap.set(row.user_id, { count: 1, lastDate: row.date })
    } else {
      existing.count++
      if (row.date > (existing.lastDate ?? '')) existing.lastDate = row.date
    }
  }

  // Aggregate insight counts per user
  const insightMap = new Map<string, number>()
  for (const row of allInsights ?? []) {
    insightMap.set(row.user_id, (insightMap.get(row.user_id) ?? 0) + 1)
  }

  const userRows = users
    .map(u => ({
      email: u.email ?? '(no email)',
      signupDate: u.created_at,
      totalEntries: entryMap.get(u.id)?.count ?? 0,
      lastEntryDate: entryMap.get(u.id)?.lastDate ?? null,
      totalInsights: insightMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime())

  const totalEntries = (allEntries ?? []).length
  const totalInsights = (allInsights ?? []).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--n-text)' }}>
          Analytics
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--n-text3)' }}>
          Usage overview across all users.
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--n-border)' }} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Users', value: users.length },
          { label: 'Entries', value: totalEntries },
          { label: 'Saved insights', value: totalInsights },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg px-4 py-3"
            style={{ border: '1px solid var(--n-border)' }}
          >
            <div className="text-2xl font-bold" style={{ color: 'var(--n-text)' }}>
              {stat.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--n-text3)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* User table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--n-border)' }}>
        <table className="w-full text-sm" style={{ color: 'var(--n-text)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--n-border)', background: 'var(--n-sidebar)' }}>
              <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--n-text3)' }}>
                Email
              </th>
              <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--n-text3)' }}>
                Signed up
              </th>
              <th className="text-right px-4 py-2 font-medium text-xs" style={{ color: 'var(--n-text3)' }}>
                Entries
              </th>
              <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--n-text3)' }}>
                Last entry
              </th>
              <th className="text-right px-4 py-2 font-medium text-xs" style={{ color: 'var(--n-text3)' }}>
                Insights
              </th>
            </tr>
          </thead>
          <tbody>
            {userRows.map(row => (
              <tr key={row.email} style={{ borderBottom: '1px solid var(--n-border)' }}>
                <td className="px-4 py-2" style={{ color: 'var(--n-text2)' }}>
                  {row.email}
                </td>
                <td className="px-4 py-2" style={{ color: 'var(--n-text3)' }}>
                  {new Date(row.signupDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2 text-right">{row.totalEntries}</td>
                <td className="px-4 py-2" style={{ color: 'var(--n-text3)' }}>
                  {row.lastEntryDate
                    ? new Date(row.lastEntryDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })
                    : '\u2014'}
                </td>
                <td className="px-4 py-2 text-right">{row.totalInsights}</td>
              </tr>
            ))}
            {userRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--n-text3)' }}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
