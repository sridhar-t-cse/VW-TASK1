'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

type Note = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

type IconName = 'arrow' | 'check' | 'edit' | 'file' | 'plus' | 'search' | 'spark' | 'trash' | 'x'

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3-1.1 3.4a5 5 0 0 1-3.2 3.2L4 11l3.7 1.4a5 5 0 0 1 3.2 3.2L12 19l1.1-3.4a5 5 0 0 1 3.2-3.2L20 11l-3.7-1.4a5 5 0 0 1-3.2-3.2Z" />
        <path d="m5 3 .3.9a2 2 0 0 0 1.3 1.3l.9.3-.9.3a2 2 0 0 0-1.3 1.3L5 8l-.3-.9a2 2 0 0 0-1.3-1.3l-.9-.3.9-.3a2 2 0 0 0 1.3-1.3Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()

  return new Intl.DateTimeFormat(undefined, {
    day: sameDay ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: sameDay ? undefined : 'short',
  }).format(date)
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.')
  }

  return data
}

export default function QuickNotesApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? notes.filter((note) => note.content.toLowerCase().includes(query)) : notes
  }, [notes, search])

  useEffect(() => {
    let active = true

    apiRequest<{ notes: Note[] }>('/api/quick-notes')
      .then((data) => {
        if (active) setNotes(data.notes)
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function saveNote(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Please write something before saving your note.')
      composerRef.current?.focus()
      return
    }

    setBusy(true)
    try {
      const data = await apiRequest<{ note: Note }>('/api/quick-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setNotes((current) => [data.note, ...current])
      setContent('')
      setToast('Your note has been saved.')
      composerRef.current?.focus()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save note.')
    } finally {
      setBusy(false)
    }
  }

  function startEditing(note: Note) {
    setEditingId(note.id)
    setEditContent(note.content)
    setError('')
  }

  async function updateNote(id: string) {
    setError('')
    setBusy(true)
    try {
      const data = await apiRequest<{ note: Note }>(`/api/quick-notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editContent }),
      })
      setNotes((current) => [data.note, ...current.filter((note) => note.id !== data.note.id)])
      setEditingId(null)
      setToast('Your changes have been saved.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update note.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteNote() {
    if (!deletingNote) return
    setError('')
    setBusy(true)
    try {
      await apiRequest(`/api/quick-notes/${deletingNote.id}`, { method: 'DELETE' })
      setNotes((current) => current.filter((note) => note.id !== deletingNote.id))
      setDeletingNote(null)
      setToast('Note deleted.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete note.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f6fb] text-[#232335]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-28 size-80 rounded-full bg-[#d9d9fb]/45 blur-3xl" />
        <div className="absolute -right-28 top-10 size-96 rounded-full bg-[#ccece7]/45 blur-3xl" />
      </div>

      <header className="relative border-b border-white/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a className="group flex items-center gap-3" href="#" aria-label="QuickNotes home">
            <span className="grid size-10 place-items-center rounded-xl bg-[#6058c7] text-white shadow-[0_8px_24px_rgba(96,88,199,.28)] transition-transform group-hover:-rotate-3">
              <Icon name="file" className="size-[21px]" />
            </span>
            <span>
              <span className="block text-[17px] font-bold tracking-[-.025em]">QuickNotes</span>
              <span className="hidden text-[11px] font-medium text-[#89899a] sm:block">
                Capture your thoughts, instantly.
              </span>
            </span>
          </a>
          <div className="flex items-center gap-2 rounded-full border border-[#e7e7ef] bg-white px-3.5 py-2 text-xs font-semibold text-[#6f6f82] shadow-sm">
            <span className="size-2 rounded-full bg-[#63bcae] shadow-[0_0_0_3px_rgba(99,188,174,.14)]" />
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfdef4] bg-[#f0effc] px-3 py-1.5 text-xs font-bold tracking-wide text-[#6058c7]">
            <Icon name="spark" className="size-4" />
            YOUR DIGITAL NOTEBOOK
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-[-.045em] text-[#252536] sm:text-5xl lg:text-[56px]">
            What&apos;s on your mind?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-7 text-[#747487] sm:text-base">
            A quiet place for ideas, reminders, and everything in between.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <form
            className="rounded-[24px] border border-white bg-white p-2.5 shadow-[0_22px_60px_rgba(59,56,98,.11)] transition-shadow focus-within:shadow-[0_26px_70px_rgba(72,65,151,.16)] sm:p-3"
            onSubmit={saveNote}
          >
            <label className="sr-only" htmlFor="new-note">
              Write a new note
            </label>
            <textarea
              ref={composerRef}
              id="new-note"
              className="min-h-36 w-full resize-none rounded-2xl bg-[#fafafe] px-5 py-5 text-[16px] leading-7 text-[#2f2f40] outline-none placeholder:text-[#aaaaba] sm:min-h-40 sm:px-6"
              maxLength={5000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Start writing your note..."
              value={content}
            />
            <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-2 sm:px-3">
              <span className="text-xs font-medium text-[#a0a0af]">
                {content.length.toLocaleString()} / 5,000
              </span>
              <button
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#6058c7] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(96,88,199,.25)] transition-all hover:-translate-y-0.5 hover:bg-[#5149ba] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={busy || !content.trim()}
                type="submit"
              >
                <Icon
                  name={busy ? 'spark' : 'plus'}
                  className={`size-[18px] ${busy ? 'animate-pulse' : ''}`}
                />
                {busy ? 'Saving...' : 'Save note'}
              </button>
            </div>
          </form>
          {error && (
            <div
              className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#f1d9dd] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#a54857]"
              role="alert"
            >
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError('')} type="button">
                <Icon name="x" className="size-4" />
              </button>
            </div>
          )}
        </section>

        <section className="mt-16" aria-labelledby="notes-heading">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1.5 text-xs font-bold tracking-[.15em] text-[#8f8fa2]">
                YOUR COLLECTION
              </p>
              <h2 id="notes-heading" className="text-2xl font-bold tracking-[-.03em]">
                Recent notes
              </h2>
            </div>
            <label className="relative block sm:w-64">
              <span className="sr-only">Search notes</span>
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#9898aa]"
              />
              <input
                className="w-full rounded-xl border border-[#e5e5ed] bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#aaa6de] focus:ring-4 focus:ring-[#6058c7]/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your notes"
                type="search"
                value={search}
              />
              {search && (
                <button
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9999aa] hover:text-[#343446]"
                  onClick={() => setSearch('')}
                  type="button"
                >
                  <Icon name="x" className="size-4" />
                </button>
              )}
            </label>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading notes">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-52 animate-pulse rounded-[20px] border border-white bg-white/70"
                  key={item}
                />
              ))}
            </div>
          ) : visibleNotes.length ? (
            <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleNotes.map((note, index) => (
                <article
                  className="group animate-note-in rounded-[20px] border border-white bg-white p-5 shadow-[0_8px_30px_rgba(60,59,84,.07)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(60,59,84,.11)]"
                  key={note.id}
                  style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
                >
                  {editingId === note.id ? (
                    <>
                      <label className="sr-only" htmlFor={`edit-${note.id}`}>
                        Edit note
                      </label>
                      <textarea
                        autoFocus
                        className="min-h-36 w-full resize-none rounded-xl border border-[#d9d7ed] bg-[#fbfbfe] p-3.5 text-[15px] leading-6 outline-none ring-[#6058c7]/10 focus:ring-4"
                        id={`edit-${note.id}`}
                        maxLength={5000}
                        onChange={(event) => setEditContent(event.target.value)}
                        value={editContent}
                      />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#aaaaba]">
                          {editContent.length} / 5,000
                        </span>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg px-3 py-2 text-xs font-bold text-[#777789] hover:bg-[#f1f1f6]"
                            onClick={() => setEditingId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6058c7] px-3 py-2 text-xs font-bold text-white hover:bg-[#5149ba] disabled:opacity-50"
                            disabled={busy || !editContent.trim()}
                            onClick={() => updateNote(note.id)}
                            type="button"
                          >
                            <Icon name="check" className="size-3.5" />
                            Save
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-[#efeffb] text-[#6058c7]">
                          <Icon name="file" className="size-[17px]" />
                        </span>
                        <div className="flex gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                          <button
                            aria-label="Edit note"
                            className="grid size-9 place-items-center rounded-lg text-[#89899a] transition hover:bg-[#efeffb] hover:text-[#6058c7]"
                            onClick={() => startEditing(note)}
                            type="button"
                          >
                            <Icon name="edit" className="size-4" />
                          </button>
                          <button
                            aria-label="Delete note"
                            className="grid size-9 place-items-center rounded-lg text-[#89899a] transition hover:bg-[#fff0f2] hover:text-[#bd5563]"
                            onClick={() => setDeletingNote(note)}
                            type="button"
                          >
                            <Icon name="trash" className="size-4" />
                          </button>
                        </div>
                      </div>
                      <p className="min-h-24 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#3b3b4c]">
                        {note.content}
                      </p>
                      <div className="mt-6 flex items-center justify-between border-t border-[#f0f0f4] pt-4 text-[11px] font-semibold text-[#a0a0b0]">
                        <span>Edited {formatDate(note.updatedAt)}</span>
                        <Icon
                          name="arrow"
                          className="size-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        />
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#d9d8e5] bg-white/55 px-6 py-16 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#ecebf9] text-[#6058c7]">
                <Icon name={search ? 'search' : 'file'} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">
                {search ? 'No matching notes' : 'Your notebook is ready'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#858597]">
                {search
                  ? 'Try a different word or clear your search.'
                  : 'Write your first thought above and it will appear here.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {deletingNote && (
        <div
          aria-labelledby="delete-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-[#1f1e34]/35 p-5 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-[24px] border border-white bg-white p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-[#fff0f2] text-[#bd5563]">
              <Icon name="trash" className="size-5" />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-[-.025em]" id="delete-title">
              Delete this note?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#777789]">
              This action cannot be undone. The note will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#6f6f80] hover:bg-[#f2f2f6]"
                onClick={() => setDeletingNote(null)}
                type="button"
              >
                Keep note
              </button>
              <button
                className="rounded-xl bg-[#bd5563] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#a94654] disabled:opacity-50"
                disabled={busy}
                onClick={deleteNote}
                type="button"
              >
                {busy ? 'Deleting...' : 'Delete note'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2"
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#29283a] px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
            <span className="grid size-5 place-items-center rounded-full bg-[#63bcae]">
              <Icon name="check" className="size-3" />
            </span>
            {toast}
          </div>
        )}
      </div>
    </main>
  )
}
