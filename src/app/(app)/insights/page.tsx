export const dynamic = 'force-dynamic'

import AIOutput from '@/components/insights/AIOutput'
import PrepOneOnOneForm from '@/components/insights/PrepOneOnOneForm'

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--n-text)' }}>✨ Insights</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--n-text3)' }}>AI-powered synthesis of your journal.</p>
      </div>

      <div style={{ borderTop: '1px solid var(--n-border)' }} />

      <div className="space-y-3">
        <AIOutput
          title="End-of-week synthesis"
          description="Wins, patterns, tensions, and what to carry forward from this week."
          icon="📅"
          streamConfig={{ url: '/api/ai/weekly-synthesis', body: { weekOffset: 0 } }}
        />

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--n-border)' }}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--n-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span>🤝</span>
              <h2 className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>Prep my 1:1</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--n-text3)' }}>
              Pull journal entries mentioning a person and generate talking points.
            </p>
          </div>
          <div className="px-4 py-4">
            <PrepOneOnOneForm />
          </div>
        </div>

        <AIOutput
          title="Quarterly reflection"
          description="Turn the last 90 days into a structured leadership narrative."
          icon="📊"
          streamConfig={{ url: '/api/ai/quarterly-reflection', body: {} }}
        />
      </div>
    </div>
  )
}
