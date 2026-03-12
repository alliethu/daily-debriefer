'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useCallback } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionType = any

interface Props {
  id?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minRows?: number
}

// Check if text content is effectively empty (just whitespace or empty HTML)
export function isRichTextEmpty(html: string): boolean {
  if (!html) return true
  const stripped = html.replace(/<[^>]*>/g, '').trim()
  return stripped.length === 0
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="rounded transition-colors disabled:opacity-30"
      style={{
        padding: '2px 6px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--n-text)' : 'var(--n-text3)',
        background: active ? 'var(--n-active)' : 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        lineHeight: '20px',
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = active ? 'var(--n-active)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

export default function RichTextArea({ id, value, onChange, placeholder, minRows = 4 }: Props) {
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionType>(null)
  const isListeningRef = useRef(false)
  const retriesRef = useRef(0)
  const hasInitialized = useRef(false)

  const MAX_RETRIES = 3

  // Detect speech support on the client only to avoid hydration mismatch
  useEffect(() => {
    setHasSpeechSupport(
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    )
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    editorProps: {
      attributes: {
        id: id ?? '',
        style: [
          'outline: none',
          'color: var(--n-text)',
          'font-size: 14px',
          'line-height: 1.6',
          `min-height: ${minRows * 1.6}em`,
          'padding: 8px 12px',
          'cursor: text',
        ].join('; '),
      },
    },
  })

  // Set initial content once (avoid cursor jumps on re-render)
  useEffect(() => {
    if (editor && !hasInitialized.current && value) {
      editor.commands.setContent(value)
      hasInitialized.current = true
    }
  }, [editor, value])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    retriesRef.current = 0
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (!editor) return

    if (isListeningRef.current) {
      stopListening()
      return
    }

    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    setSpeechError(null)
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      retriesRef.current = 0
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript && editor) {
        editor.chain().focus().insertContent(transcript).run()
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        isListeningRef.current = false
        retriesRef.current = 0
        setSpeechError('Microphone access denied. Check browser permissions.')
        setListening(false)
      } else if (event.error === 'network') {
        retriesRef.current++
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current) {
        if (retriesRef.current >= MAX_RETRIES) {
          isListeningRef.current = false
          retriesRef.current = 0
          setSpeechError('Speech recognition unavailable. Check your internet connection.')
          setListening(false)
          return
        }
        try {
          recognition.start()
        } catch {
          isListeningRef.current = false
          retriesRef.current = 0
          setListening(false)
        }
        return
      }
      setListening(false)
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    retriesRef.current = 0
    recognition.start()
    setListening(true)
    editor.commands.focus('end')
  }, [editor, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      retriesRef.current = 0
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!editor) return null

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--n-active)',
        border: `1px solid ${focused ? 'rgba(26,111,196,0.5)' : 'var(--n-border)'}`,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1"
        style={{ borderBottom: '1px solid var(--n-border)' }}
      >
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>

        <span style={{ width: 1, height: 16, background: 'var(--n-border)', margin: '0 4px' }} />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <text x="1" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
            <text x="1" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
            <text x="1" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
          </svg>
        </ToolbarButton>

        {hasSpeechSupport && (
          <>
            <span style={{ width: 1, height: 16, background: 'var(--n-border)', margin: '0 4px' }} />
            <ToolbarButton
              active={listening}
              onClick={toggleListening}
              title={listening ? 'Stop recording' : 'Voice input'}
            >
              <span className="flex items-center gap-1">
                {listening ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#c62828' }} />
                    <span style={{ fontSize: '11px' }}>Stop</span>
                  </>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="1" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                  </svg>
                )}
              </span>
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Speech error */}
      {speechError && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs"
          style={{ background: 'rgba(198,40,40,0.06)', color: '#c62828', borderBottom: '1px solid var(--n-border)' }}>
          <span>{speechError}</span>
          <button type="button" onClick={() => setSpeechError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', fontSize: '14px' }}>
            &times;
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Tiptap styles */}
      <style>{`
        .tiptap {
          outline: none;
        }
        .tiptap p {
          margin: 0;
        }
        .tiptap p + p {
          margin-top: 0.25em;
        }
        .tiptap ul, .tiptap ol {
          padding-left: 1.5em;
          margin: 0.25em 0;
        }
        .tiptap li {
          margin: 0.1em 0;
        }
        .tiptap li p {
          margin: 0;
        }
        .tiptap strong {
          font-weight: 600;
        }
        .tiptap em {
          font-style: italic;
        }
        .tiptap .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--n-text3);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
