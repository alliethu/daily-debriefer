export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PeopleList from '@/components/people/PeopleList'
import MyContext from '@/components/people/MyContext'
import { type Person } from '@/lib/types'

export default async function PeoplePage() {
  const supabase = await createClient()

  const [{ data: people }, { data: ctx }] = await Promise.all([
    supabase.from('people').select('*, person_documents(*)').order('name'),
    supabase.from('user_context').select('context').single(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--n-text)' }}>
          People & Context
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--n-text3)' }}>
          Build context about yourself and the people you work with to enrich your insights.
        </p>
      </div>

      <MyContext initialContext={ctx?.context ?? ''} />

      <div style={{ borderTop: '1px solid var(--n-border)' }} />

      <PeopleList initialPeople={(people ?? []) as Person[]} />
    </div>
  )
}
