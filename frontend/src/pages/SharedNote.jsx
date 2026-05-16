import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  LoaderCircle,
  PenLine,
  Sparkles,
  Tag,
} from 'lucide-react'
import { getSharedNote } from '../services/sharedApi'
import { exportNoteToPdf } from '../utils/exportNotePdf'

function formatDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function sanitizeHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html || ''

  template.content.querySelectorAll('script, iframe, object, embed').forEach((node) => node.remove())
  template.content.querySelectorAll('*').forEach((node) => {
    ;[...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()

      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name)
      }
    })
  })

  return template.innerHTML
}

function buildAiFromNote(note) {
  if (!note?.aiSummary) return null

  return {
    summary: note.aiSummary,
    action_items: note.aiActionItems || [],
    suggested_title: note.aiSuggestedTitle || '',
    detailed_summary: note.aiData?.detailedSummary || [],
    key_points: note.aiData?.keyPoints || [],
    difficulty: note.aiData?.difficulty || 'Beginner',
    quick_revision: note.aiData?.quickRevision || '',
  }
}

function PublicAiSummary({ ai }) {
  if (!ai) return null

  return (
    <section className="mt-8 rounded-[1.75rem] border border-cyan-200/70 bg-white/72 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-cyan-300/15 dark:bg-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">AI Study Summary</h2>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            Generated from this public note
          </p>
        </div>
        <span className="w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100">
          {ai.difficulty || 'Beginner'}
        </span>
      </div>

      {ai.suggested_title && (
        <div className="mt-5 rounded-2xl border border-white/70 bg-cyan-50/75 p-4 dark:border-white/10 dark:bg-cyan-300/10">
          <p className="text-xs font-black uppercase text-cyan-700 dark:text-cyan-200">
            Suggested title
          </p>
          <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
            {ai.suggested_title}
          </p>
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
          Summary
        </h3>
        <p className="mt-2 leading-8 text-slate-700 dark:text-slate-200">{ai.summary}</p>
      </div>

      {(ai.action_items || []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
            Action Items
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {ai.action_items.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-white/70 bg-white/55 p-3 font-bold leading-6 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-200" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(ai.key_points || []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
            Key Points
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ai.key_points.map((point) => (
              <span
                key={point}
                className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}

      {ai.quick_revision && (
        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-300/20 dark:bg-violet-300/10">
          <p className="text-xs font-black uppercase text-violet-700 dark:text-violet-200">
            Quick Revision
          </p>
          <p className="mt-2 leading-7 text-slate-700 dark:text-slate-200">{ai.quick_revision}</p>
        </div>
      )}
    </section>
  )
}

function SharedError({ title, message }) {
  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-[linear-gradient(135deg,#f8fafc,#ecfeff,#f5f3ff)] px-4 py-10 dark:bg-[linear-gradient(135deg,#020617,#0f172a,#111827)]">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/75 p-6 text-center shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
          <AlertCircle size={24} />
        </div>
        <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{message}</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950"
        >
          Create your own notes
        </Link>
      </section>
    </main>
  )
}

function SharedNote() {
  const { shareId } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSharedNote() {
      setLoading(true)
      setError(null)

      try {
        const data = await getSharedNote(shareId)
        if (isMounted) setNote(data.note)
      } catch (err) {
        if (!isMounted) return

        if (err.response?.status === 410) {
          setError({
            title: 'This shared note link has expired.',
            message: 'This note is no longer public.',
          })
          return
        }

        setError({
          title: 'Shared note not found.',
          message: 'This shared note link is invalid.',
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadSharedNote()

    return () => {
      isMounted = false
    }
  }, [shareId])

  async function handleDownloadPdf() {
    if (!note) return

    setPdfLoading(true)

    try {
      await exportNoteToPdf({
        note: {
          ...note,
          formattedDate: formatDate(note.updatedAt),
        },
        ai: buildAiFromNote(note),
      })
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-cyan-50 text-cyan-700 dark:bg-slate-950 dark:text-cyan-200">
        <LoaderCircle className="animate-spin" size={30} />
      </main>
    )
  }

  if (error) {
    return <SharedError title={error.title} message={error.message} />
  }

  const ai = buildAiFromNote(note)
  const allowPdfDownload = note?.shareSettings?.allowPdfDownload !== false

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_14%_10%,#cffafe,transparent_28%),radial-gradient(circle_at_86%_8%,#ddd6fe,transparent_22%),linear-gradient(135deg,#f8fafc,#ecfeff,#f8fafc)] px-4 py-8 dark:bg-[radial-gradient(circle_at_14%_10%,#155e75,transparent_28%),radial-gradient(circle_at_86%_8%,#312e81,transparent_22%),linear-gradient(135deg,#020617,#0f172a,#111827)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-500/25">
              <PenLine size={20} />
            </span>
            <div>
              <p className="text-lg font-black text-slate-950 dark:text-white">PebloNotes</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Public Note</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowPdfDownload && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pdfLoading ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />}
                Download PDF
              </button>
            )}
            <Link
              to="/"
              className="inline-flex h-11 items-center rounded-full border border-white/70 bg-white/60 px-4 text-sm font-black text-slate-700 backdrop-blur-xl transition hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              Create your own notes
            </Link>
          </div>
        </header>

        <article className="rounded-[2rem] border border-white/65 bg-white/76 p-5 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55 sm:p-8">
          <div className="border-b border-slate-200/70 pb-6 dark:border-white/10">
            <p className="inline-flex items-center gap-2 rounded-full bg-cyan-100/80 px-3 py-1 text-sm font-black text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-100">
              {note.category || 'General'}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
              {note.title}
            </h1>
            <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
              Updated {formatDate(note.updatedAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(note.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className="mt-8 max-w-none whitespace-pre-wrap text-lg leading-9 text-slate-800 dark:text-slate-100"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(note.content || note.plainText || 'This note is still empty.'),
            }}
          />

          <PublicAiSummary ai={ai} />

          <footer className="mt-8 flex items-center gap-2 border-t border-slate-200/70 pt-5 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <Sparkles size={16} />
            Shared read-only with PebloNotes.
          </footer>
        </article>
      </div>
    </main>
  )
}

export default SharedNote
