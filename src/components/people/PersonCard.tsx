'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Person, type PersonDocument, RELATIONSHIP_OPTIONS } from '@/lib/types'
import DocumentUpload from './DocumentUpload'

interface Props {
  person: Person
  onDelete: (id: string) => void
}

export default function PersonCard({ person, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [docs, setDocs] = useState<PersonDocument[]>(person.person_documents ?? [])
  const [deleting, setDeleting] = useState(false)

  const relLabel = RELATIONSHIP_OPTIONS.find(o => o.value === person.relationship)?.label ?? person.relationship

  async function handleDelete() {
    if (!confirm(`Remove ${person.name}? Their documents will also be deleted.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('people').delete().eq('id', person.id)
    if (!error) onDelete(person.id)
    setDeleting(false)
  }

  async function deleteDoc(docId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('person_documents').delete().eq('id', docId)
    if (!error) setDocs(prev => prev.filter(d => d.id !== docId))
  }

  function handleDocSaved(doc: PersonDocument) {
    setDocs(prev => [...prev, doc])
  }

  return (
    <div className="rounded-lg" style={{ border: '1px solid var(--n-border)' }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: expanded ? 'var(--n-active)' : 'transparent' }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>{person.name}</span>
        <span className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--n-active)', color: 'var(--n-text3)', border: '1px solid var(--n-border)' }}>
          {relLabel}
        </span>
        {docs.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--n-text3)' }}>
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--n-text3)' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid var(--n-border)' }}>
          {/* Notes */}
          {person.notes && (
            <p className="text-sm pt-3" style={{ color: 'var(--n-text2)' }}>{person.notes}</p>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium" style={{ color: 'var(--n-text3)' }}>Documents</p>
              {docs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={deleteDoc} />
              ))}
            </div>
          )}

          {/* Add context */}
          <div className="pt-2">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--n-text3)' }}>Add context</p>
            <AddContextForm personId={person.id} onSaved={handleDocSaved} />
          </div>

          {/* Delete person */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--n-border)' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs transition-colors disabled:opacity-40"
              style={{ color: 'var(--n-text3)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c62828' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--n-text3)' }}
            >
              {deleting ? 'Removing...' : 'Remove person'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddContextForm({ personId, onSaved }: { personId: string; onSaved: (doc: PersonDocument) => void }) {
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [label, setLabel] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--n-border)',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '13px',
    color: 'var(--n-text)',
    outline: 'none',
  }

  async function handleSaveText() {
    if (!text.trim()) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }

    const { data: doc, error: dbError } = await supabase
      .from('person_documents')
      .insert({
        person_id: personId,
        user_id: user.id,
        type: 'other',
        label: label.trim() || 'Context',
        summary: text.trim(),
      })
      .select('*')
      .single()

    if (dbError) { setError(dbError.message); setSaving(false); return }

    onSaved(doc as PersonDocument)
    setText('')
    setLabel('')
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1">
        {(['text', 'file'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="rounded text-xs px-2.5 py-1 transition-colors"
            style={{
              background: mode === m ? 'var(--n-active)' : 'transparent',
              color: mode === m ? 'var(--n-text)' : 'var(--n-text3)',
              border: `1px solid ${mode === m ? 'var(--n-border)' : 'transparent'}`,
            }}
          >
            {m === 'text' ? 'Write' : 'Upload file'}
          </button>
        ))}
      </div>

      {mode === 'text' ? (
        <div className="space-y-2">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional)..."
            aria-label="Document label"
            style={{ ...inputStyle, width: '100%' }}
            onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type context here... e.g. key themes from their self-reflection, level expectations, growth areas."
            rows={4}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: '1.5' }}
            onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
          />
          <button
            type="button"
            onClick={handleSaveText}
            disabled={!text.trim() || saving}
            className="rounded text-xs transition-colors disabled:opacity-30"
            style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '5px 10px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : (
        <DocumentUpload personId={personId} onSaved={onSaved} />
      )}

      {error && (
        <p role="alert" className="text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function DocumentCard({ doc, onDelete }: { doc: PersonDocument; onDelete: (id: string) => void }) {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <div className="rounded p-3 text-xs" style={{ background: 'var(--n-sidebar)', border: '1px solid var(--n-border)' }}>
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--n-text2)' }}>{doc.label || 'Context'}</span>
        <span style={{ color: 'var(--n-text3)' }}>
          {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => setShowSummary(!showSummary)}
          className="ml-auto"
          style={{ color: 'var(--n-blue)' }}
        >
          {showSummary ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(doc.id)}
          className="opacity-40 hover:opacity-100 transition-opacity"
          aria-label={`Delete ${doc.label || 'context'}`}
        >
          ×
        </button>
      </div>
      {showSummary && (
        <div className="mt-2 leading-relaxed" style={{ color: 'var(--n-text2)' }}>
          {doc.summary.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('**') ? 'mt-2 first:mt-0' : ''}>
              {line.startsWith('**') && line.endsWith('**')
                ? <strong style={{ color: 'var(--n-text)', fontWeight: 600 }}>{line.slice(2, -2)}</strong>
                : line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
