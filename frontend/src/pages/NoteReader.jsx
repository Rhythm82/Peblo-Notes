import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  Globe2,
  Link2,
  LoaderCircle,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import { exportNoteToPdf } from '../utils/exportNotePdf'
import {
  archiveNote,
  deleteNote,
  disableShareLink,
  generateAiSummary,
  generateShareLink,
  getNote,
  getShareStatus,
  updateNote,
} from '../services/noteApi'

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
    difficulty: note.aiData?.difficulty || '',
    quick_revision: note.aiData?.quickRevision || '',
  }
}

function AiLoadingCard({ warmMode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden rounded-[1.75rem] border p-[1px] shadow-2xl shadow-cyan-900/10 ${
        warmMode
          ? 'border-amber-200/80 bg-gradient-to-br from-amber-200/80 via-white/70 to-violet-200/70'
          : 'border-cyan-200/60 bg-gradient-to-br from-cyan-300/70 via-white/60 to-violet-300/70 dark:border-cyan-300/20 dark:from-cyan-400/25 dark:via-white/10 dark:to-violet-400/25'
      }`}
    >
      <div
        className={`rounded-[1.65rem] p-5 backdrop-blur-2xl sm:p-6 ${
          warmMode
            ? 'bg-amber-50/78 text-amber-950'
            : 'bg-white/75 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-200">
            <WandSparkles size={20} />
          </div>
          <div>
            <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/15" />
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              Reading your note and preparing a simple summary...
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/80 dark:bg-white/15" />
          <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/15" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/15" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-9 w-24 animate-pulse rounded-full bg-cyan-100/80 dark:bg-cyan-300/15"
            />
          ))}
        </div>
      </div>
    </motion.section>
  )
}

function AiSummaryCard({ ai, warmMode, onUseTitle, titleUpdating, titleMessage }) {
  const detailedSummary = ai.detailed_summary || []
  const keyPoints = ai.key_points || []
  const actionItems = ai.action_items || []

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden rounded-[1.75rem] border p-[1px] shadow-2xl ${
        warmMode
          ? 'border-amber-200/80 bg-gradient-to-br from-amber-200 via-white/70 to-violet-200 shadow-amber-900/10'
          : 'border-cyan-200/60 bg-gradient-to-br from-cyan-300/80 via-white/60 to-violet-300/80 shadow-cyan-900/10 dark:border-cyan-300/20 dark:from-cyan-400/30 dark:via-white/10 dark:to-violet-400/30'
      }`}
    >
      <div
        className={`relative rounded-[1.65rem] p-5 backdrop-blur-2xl sm:p-6 ${
          warmMode
            ? 'bg-amber-50/82 text-amber-950'
            : 'bg-white/80 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent dark:via-cyan-200/40" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-200/70 dark:text-cyan-200 dark:ring-cyan-300/20">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-normal">AI Study Summary</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                Generated from your note
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-cyan-200/80 bg-cyan-50/75 px-3 py-1 text-xs font-black text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
            {ai.difficulty || ''}
          </span>
        </div>

        {ai.suggested_title && (
          <section className="mt-6 rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-white/80 to-cyan-50/80 p-4 shadow-lg shadow-cyan-900/5 dark:border-cyan-300/20 dark:from-white/10 dark:to-cyan-300/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-cyan-700 dark:text-cyan-200">
                  Suggested Title
                </p>
                <p className="mt-2 text-lg font-black">{ai.suggested_title}</p>
              </div>
              <button
                type="button"
                onClick={onUseTitle}
                disabled={titleUpdating}
                className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
              >
                {titleUpdating && <LoaderCircle className="animate-spin" size={14} />}
                Use this title
              </button>
            </div>
            {titleMessage && (
              <p className="mt-3 text-sm font-black text-cyan-800 dark:text-cyan-100">
                {titleMessage}
              </p>
            )}
          </section>
        )}

        <section className="mt-5">
          <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
            Summary
          </h3>
          <p className="mt-2 leading-8">{ai.summary}</p>
        </section>

        {detailedSummary.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
              Detailed Summary
            </h3>
            <ul className="mt-3 space-y-3">
              {detailedSummary.map((point) => (
                <li key={point} className="flex gap-3 leading-7">
                  <Sparkles className="mt-1 shrink-0 text-violet-600 dark:text-violet-300" size={16} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {keyPoints.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
              Key Points
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {keyPoints.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-cyan-200/80 bg-cyan-50/75 px-3 py-2 text-sm font-black text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100"
                >
                  {point}
                </span>
              ))}
            </div>
          </section>
        )}

        {actionItems.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400">
              Action Items
            </h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {actionItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/70 bg-white/50 p-3 leading-6 dark:border-white/10 dark:bg-white/10"
                >
                  <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-200" size={18} />
                  <span className="font-bold">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ai.quick_revision && (
          <section className="mt-6 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-300/20 dark:bg-violet-300/10">
            <p className="text-xs font-black uppercase text-violet-700 dark:text-violet-200">
              Quick Revision
            </p>
            <p className="mt-2 leading-7">{ai.quick_revision}</p>
          </section>
        )}
      </div>
    </motion.section>
  )
}

function DeleteModal({ note, busy, onCancel, onConfirm }) {
  if (!note) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-950/90">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
          <Trash2 size={22} />
        </div>
        <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
          Delete this note?
        </h2>
        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
          This will remove "{note.title}" from your active notes.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </section>
    </div>
  )
}

function ShareModal({
  shareData,
  busy,
  message,
  error,
  onClose,
  onCopy,
  onDisable,
  onGenerate,
}) {
  const isPublic = Boolean(shareData?.isPublic)
  const shareUrl = shareData?.shareUrl || ''

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/88 p-[1px] shadow-2xl shadow-cyan-950/25 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/88">
        <div className="rounded-[1.95rem] bg-gradient-to-br from-white/90 via-cyan-50/85 to-violet-50/85 p-5 dark:from-slate-950/95 dark:via-cyan-950/55 dark:to-violet-950/50 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-200/70 dark:text-cyan-200 dark:ring-cyan-300/20">
                <Share2 size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                  Share this note
                </h2>
                <p className="mt-1 leading-7 text-slate-600 dark:text-slate-300">
                  Anyone with this link can read this note. Editing is not allowed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/70 bg-white/60 text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              aria-label="Close share dialog"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/58 p-4 dark:border-white/10 dark:bg-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Globe2 size={18} className={isPublic ? 'text-cyan-700 dark:text-cyan-200' : 'text-slate-400'} />
                <p className="font-black text-slate-800 dark:text-slate-100">
                  {isPublic ? 'Public link is active' : 'Public sharing is off'}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                  isPublic
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                }`}
              >
                {isPublic ? 'Public' : 'Private'}
              </span>
            </div>

            {isPublic && (
              <>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={shareUrl}
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-cyan-100 bg-white/78 px-4 text-sm font-bold text-slate-700 outline-none dark:border-cyan-300/20 dark:bg-slate-950/45 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={onCopy}
                    disabled={busy || !shareUrl}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>
                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                  <p>Views: {shareData?.shareViews || 0}</p>
                  <p>
                    Last viewed:{' '}
                    {shareData?.lastSharedViewedAt ? formatDate(shareData.lastSharedViewedAt) : 'Not yet'}
                  </p>
                </div>
              </>
            )}
          </div>

          {message && (
            <p className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/85 px-4 py-3 text-sm font-black text-cyan-800 dark:border-cyan-300/10 dark:bg-cyan-400/10 dark:text-cyan-100">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/85 px-4 py-3 text-sm font-black text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {isPublic && (
              <button
                type="button"
                onClick={onDisable}
                disabled={busy}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-300/15 dark:bg-rose-500/10 dark:text-rose-200"
              >
                Disable Link
              </button>
            )}
            <button
              type="button"
              onClick={isPublic ? onCopy : onGenerate}
              disabled={busy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-700 to-violet-700 px-5 text-sm font-black text-white shadow-xl shadow-cyan-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Link2 size={17} />}
              {isPublic ? 'Copy Link' : 'Generate Public Link'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function NoteReader() {
  const { id } = useParams()
  const navigate = useNavigate()
  const aiSectionRef = useRef(null)
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [warmMode, setWarmMode] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showAiCard, setShowAiCard] = useState(false)
  const [titleUpdating, setTitleUpdating] = useState(false)
  const [titleMessage, setTitleMessage] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [shareError, setShareError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadNote() {
      setLoading(true)
      setError('')

      try {
        const { note: loadedNote } = await getNote(id)
        if (isMounted) {
          const existingAi = buildAiFromNote(loadedNote)
          setNote(loadedNote)
          setAi(existingAi)
          setShowAiCard(Boolean(existingAi))
          setTitleMessage('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not open this note.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadNote()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleArchive() {
    if (!note) return

    setBusy(true)
    setError('')
    try {
      const { note: updatedNote } = await archiveNote(note._id)
      setNote(updatedNote)
    } catch (err) {
      setError(err.response?.data?.message || 'Archive action failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!note) return

    setBusy(true)
    setError('')
    try {
      await deleteNote(note._id)
      navigate('/notes')
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed. Please try again.')
      setBusy(false)
    }
  }

  async function handleGenerateSummary() {
    if (!note) return

    setAiLoading(true)
    setAiError('')
    setTitleMessage('')
    setShowAiCard(true)

    try {
      const data = await generateAiSummary(note._id)
      setAi(data.ai)
      if (data.note) setNote(data.note)

      window.setTimeout(() => {
        aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI summary failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleUseSuggestedTitle() {
    const suggestedTitle = ai?.suggested_title?.trim()
    if (!note || !suggestedTitle) return

    setTitleUpdating(true)
    setTitleMessage('')
    setError('')

    try {
      const { note: updatedNote } = await updateNote(note._id, { title: suggestedTitle })
      setNote(updatedNote)
      setTitleMessage('Title updated.')
    } catch (err) {
      setTitleMessage('')
      setError(err.response?.data?.message || 'Could not update the title.')
    } finally {
      setTitleUpdating(false)
    }
  }

  async function handleDownloadPdf() {
    if (!note) return

    setPdfLoading(true)
    setError('')

    try {
      await exportNoteToPdf({
        note: {
          ...note,
          formattedDate: formatDate(note.lastEditedAt || note.updatedAt),
        },
        ai,
      })
    } catch {
      setError('PDF download failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleOpenShare() {
    if (!note) return

    setShowShare(true)
    setShareLoading(true)
    setShareMessage('')
    setShareError('')

    try {
      const status = await getShareStatus(note._id)
      setShareData(status)
    } catch (err) {
      setShareError(err.response?.data?.message || 'Could not load sharing status.')
    } finally {
      setShareLoading(false)
    }
  }

  async function handleGenerateShareLink() {
    if (!note) return

    setShareLoading(true)
    setShareMessage('')
    setShareError('')

    try {
      const data = await generateShareLink(note._id)
      setNote(data.note)
      setShareData({
        isPublic: data.note.isPublic,
        shareId: data.note.shareId,
        shareUrl: data.shareUrl,
        shareCreatedAt: data.note.shareCreatedAt,
        shareDisabledAt: data.note.shareDisabledAt,
        shareViews: data.note.shareViews || 0,
        lastSharedViewedAt: data.note.lastSharedViewedAt,
      })
      setShareMessage('Public share link generated.')
    } catch (err) {
      setShareError(err.response?.data?.message || 'Could not generate public link.')
    } finally {
      setShareLoading(false)
    }
  }

  async function copyShareLink() {
    if (!shareData?.shareUrl) return

    try {
      await navigator.clipboard.writeText(shareData.shareUrl)
      setShareMessage('Link copied.')
      setShareError('')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareData.shareUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      setShareMessage('Link copied.')
      setShareError('')
    }
  }

  async function handleDisableShareLink() {
    if (!note) return

    setShareLoading(true)
    setShareMessage('')
    setShareError('')

    try {
      const data = await disableShareLink(note._id)
      setNote(data.note)
      setShareData((current) => ({
        ...current,
        isPublic: false,
        shareId: data.note.shareId,
        shareUrl: '',
        shareDisabledAt: data.note.shareDisabledAt,
        shareViews: data.note.shareViews || current?.shareViews || 0,
        lastSharedViewedAt: data.note.lastSharedViewedAt,
      }))
      setShareMessage('Public share link disabled.')
    } catch (err) {
      setShareError(err.response?.data?.message || 'Could not disable public link.')
    } finally {
      setShareLoading(false)
    }
  }

  const readerBackground = warmMode
    ? 'bg-[linear-gradient(135deg,#fff7d6,#fffbeb,#fef3c7)] text-amber-950'
    : 'bg-white/72 text-slate-900 dark:bg-slate-950/40 dark:text-slate-100'
  const aiButtonText = aiLoading ? 'Generating...' : ai ? 'Regenerate Summary' : 'Generate AI Summary'

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_14%_10%,#cffafe,transparent_28%),radial-gradient(circle_at_86%_8%,#ddd6fe,transparent_22%),linear-gradient(135deg,#f8fafc,#ecfeff,#f8fafc)] px-4 py-6 dark:bg-[radial-gradient(circle_at_14%_10%,#155e75,transparent_28%),radial-gradient(circle_at_86%_8%,#312e81,transparent_22%),linear-gradient(135deg,#020617,#0f172a,#111827)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/notes"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 text-sm font-bold text-slate-700 backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          >
            <ArrowLeft size={17} />
            Notes
          </Link>
          {note && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWarmMode((current) => !current)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 text-sm font-black text-slate-700 backdrop-blur-2xl transition hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                <Eye size={17} />
                Eye protection
              </button>
              <Link
                to={`/notes/${note._id}/edit`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950"
              >
                <Edit3 size={17} />
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {pdfLoading ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />}
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleOpenShare}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/80 px-4 text-sm font-black text-cyan-800 backdrop-blur-xl transition hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100"
              >
                <Share2 size={17} />
                Share
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid min-h-96 place-items-center text-cyan-700 dark:text-cyan-200">
            <LoaderCircle className="animate-spin" size={32} />
          </div>
        ) : error && !note ? (
          <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
            <p className="font-bold">{error}</p>
          </section>
        ) : (
          note && (
            <article className={`rounded-[2rem] border border-white/65 p-5 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl transition-colors dark:border-white/10 sm:p-8 ${readerBackground}`}>
              <div className="flex flex-col gap-5 border-b border-slate-200/70 pb-6 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-cyan-100/80 px-3 py-1 text-sm font-black text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-100">
                    {note.category || 'General'}
                  </p>
                  <h1
                    className={`mt-4 text-4xl font-black leading-tight sm:text-5xl ${
                      warmMode ? 'text-amber-950' : 'text-slate-950 dark:text-white'
                    }`}
                  >
                    {note.title}
                  </h1>
                  <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                    Updated {formatDate(note.lastEditedAt || note.updatedAt)}
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 text-sm font-black text-slate-700 transition hover:bg-white/85 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    {note.isArchived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
                    {note.isArchived ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </div>

              <div
                className={`mt-8 max-w-none whitespace-pre-wrap text-lg leading-9 ${
                  warmMode ? 'text-amber-950' : 'text-slate-800 dark:text-slate-100'
                }`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(note.content || note.plainText || 'This note is still empty.'),
                }}
              />

              {error && (
                <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`text-sm font-bold ${
                    warmMode ? 'text-amber-800' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {aiLoading
                    ? 'Reading your note and preparing a simple summary...'
                    : ai
                      ? 'Your saved AI summary is ready below.'
                      : 'Generate a study-friendly summary from this note.'}
                </p>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={aiLoading}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-700 to-violet-700 px-5 text-sm font-black text-white shadow-xl shadow-cyan-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {aiLoading ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  {aiButtonText}
                </button>
              </div>

              {aiError && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/85 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
                  <AlertCircle size={16} />
                  AI summary failed. Please try again.
                </p>
              )}

              <div ref={aiSectionRef} className="mt-6 scroll-mt-24">
                <AnimatePresence mode="wait">
                  {showAiCard && aiLoading ? (
                    <AiLoadingCard key="ai-loading" warmMode={warmMode} />
                  ) : showAiCard && ai ? (
                    <AiSummaryCard
                      key="ai-summary"
                      ai={ai}
                      warmMode={warmMode}
                      onUseTitle={handleUseSuggestedTitle}
                      titleUpdating={titleUpdating}
                      titleMessage={titleMessage}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            </article>
          )
        )}
      </div>

      <DeleteModal
        note={showDelete ? note : null}
        busy={busy}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />

      {showShare && (
        <ShareModal
          shareData={shareData}
          busy={shareLoading}
          message={shareMessage}
          error={shareError}
          onClose={() => setShowShare(false)}
          onCopy={copyShareLink}
          onDisable={handleDisableShareLink}
          onGenerate={handleGenerateShareLink}
        />
      )}
    </main>
  )
}

export default NoteReader
