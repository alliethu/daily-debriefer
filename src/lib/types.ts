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
  attachment_summary?: string
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
  attachment_summary: string
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

export type PersonRelationship = 'direct-report' | 'manager' | 'peer' | 'stakeholder' | 'other'
export type PersonDocumentType = 'self-reflection' | 'manager-reflection' | 'current-level' | 'next-level' | 'other'

export interface Person {
  id: string
  user_id: string
  name: string
  relationship: PersonRelationship
  notes: string
  created_at: string
  updated_at: string
  person_documents?: PersonDocument[]
}

export interface PersonDocument {
  id: string
  person_id: string
  user_id: string
  type: PersonDocumentType
  label: string
  summary: string
  created_at: string
}

export const RELATIONSHIP_OPTIONS: { value: PersonRelationship; label: string }[] = [
  { value: 'direct-report', label: 'Direct report' },
  { value: 'manager', label: 'Manager' },
  { value: 'peer', label: 'Peer' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'other', label: 'Other' },
]

export const DOCUMENT_TYPE_OPTIONS: { value: PersonDocumentType; label: string }[] = [
  { value: 'self-reflection', label: 'Self-reflection' },
  { value: 'manager-reflection', label: 'Manager reflection' },
  { value: 'current-level', label: 'Current level description' },
  { value: 'next-level', label: 'Next level description' },
  { value: 'other', label: 'Other' },
]
