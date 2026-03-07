export const dynamic = 'force-dynamic'

import AIOutput from '@/components/insights/AIOutput'
import PrepOneOnOneForm from '@/components/insights/PrepOneOnOneForm'

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Insights</h1>
        <p className="text-sm text-neutral-500">AI-powered synthesis of your journal.</p>
      </div>

      <div className="space-y-4">
        {/* Weekly synthesis */}
        <AIOutput
          title="End-of-week synthesis"
          description="Analyze this week's entries — wins, patterns, tensions, what to carry forward."
          icon="◇"
          streamConfig={{
            url: '/api/ai/weekly-synthesis',
            body: { weekOffset: 0 },
          }}
        />

        {/* 1:1 prep */}
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-950 overflow-hidden">
          <div className="px-5 py-5 border-b border-neutral-900 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">◈</span>
              <h2 className="text-sm font-medium text-neutral-200">Prep my 1:1</h2>
            </div>
            <p className="text-xs text-neutral-500">
              Pull entries mentioning a person and generate talking points.
            </p>
          </div>
          <div className="px-5 py-4">
            <PrepOneOnOneForm />
          </div>
        </div>

        {/* Quarterly reflection */}
        <AIOutput
          title="Quarterly reflection"
          description="Turn the last 90 days of entries into a structured leadership narrative."
          icon="◉"
          streamConfig={{
            url: '/api/ai/quarterly-reflection',
            body: {},
          }}
        />
      </div>
    </div>
  )
}
