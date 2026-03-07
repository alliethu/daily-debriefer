import EntryForm from '@/components/entry/EntryForm'

export const dynamic = 'force-dynamic'

export default function NewEntryPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Today's debrief</h1>
        <p className="text-sm text-neutral-500">5 minutes. Write for yourself.</p>
      </div>
      <EntryForm />
    </div>
  )
}
