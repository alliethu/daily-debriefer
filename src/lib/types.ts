export type Sentiment = 'positive' | 'neutral' | 'tense'

export interface RelationshipPulse {
  id: string
  entry_id: string
  user_id: string
  person_name: string
  sentiment: Sentiment
  created_at: string
}

export interface EntryTheme {
  id: string
  entry_id: string
  user_id: string
  theme: string
  created_at: string
}

export interface Entry {
  id: string
  user_id: string
  date: string
  what_i_did: string
  impact: string
  is_quick_win: boolean
  energy_level: number
  whats_unresolved: string
  created_at: string
  updated_at: string
  relationship_pulses?: RelationshipPulse[]
  entry_themes?: EntryTheme[]
}

export interface EntryFormData {
  date: string
  what_i_did: string
  impact: string
  energy_level: number
  whats_unresolved: string
  pulses: { person_name: string; sentiment: Sentiment }[]
  themes: string[]
}

export const THEME_OPTIONS = [
  'Managing up',
  'Team coaching',
  'Systems work',
  'External visibility',
  'Delivery',
  'Strategy',
  'Hiring',
  'Culture',
  'Stakeholder alignment',
  'Cross-functional',
] as const

export type Theme = typeof THEME_OPTIONS[number]
