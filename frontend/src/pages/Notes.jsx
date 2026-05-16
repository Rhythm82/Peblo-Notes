import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Edit3,
  FilePlus2,
  Folder,
  LoaderCircle,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react'
import { archiveNote, deleteNote, getCategories, getNotes } from '../services/noteApi'

function formatDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getPreview(note) {
  const text = note.plainText || note.content || ''
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function ConfirmModal({ note, onCancel, onConfirm, busy }) {
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
          "{note.title}" will be moved out of your workspace. This keeps the app calm and avoids surprise clicks.
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

function NoteCard({ note, onArchive, onDelete }) {
  const preview = getPreview(note)

  return (
    <article className="group flex min-h-[17rem] flex-col rounded-[1.75rem] border border-white/65 bg-white/60 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/75 dark:border-white/10 dark:bg-white/10 dark:shadow-slate-950/20 dark:hover:bg-white/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/80 px-3 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-100">
            <Folder size={13} />
            {note.category || 'General'}
          </p>
          <h2 className="mt-4 line-clamp-2 text-2xl font-black text-slate-950 dark:text-white">
            {note.title}
          </h2>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-600/20">
          <Sparkles size={18} />
        </span>
      </div>

      <p className="mt-4 line-clamp-3 flex-1 leading-7 text-slate-600 dark:text-slate-300">
        {preview || 'No words yet. Open this note and let the first idea ripple in.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(note.tags || []).slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300"
          >
            <Tag size={12} />
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/60 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Updated {formatDate(note.lastEditedAt || note.updatedAt)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/notes/${note._id}`}
            className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950"
          >
            Open
          </Link>
          <Link
            to={`/notes/${note._id}/edit`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/60 text-slate-700 transition hover:text-cyan-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            aria-label={`Edit ${note.title}`}
            title="Edit"
          >
            <Edit3 size={15} />
          </Link>
          <button
            type="button"
            onClick={() => onArchive(note)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/60 text-slate-700 transition hover:text-cyan-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            aria-label={note.isArchived ? 'Restore note' : 'Archive note'}
            title={note.isArchived ? 'Restore' : 'Archive'}
          >
            {note.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200/70 bg-rose-50/80 text-rose-600 transition hover:bg-rose-100 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200"
            aria-label={`Delete ${note.title}`}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const categoryTabs = useMemo(() => {
    const names = categories.map((category) => category.name || 'General')
    return ['All', 'General', ...names.filter((name) => name !== 'General')]
  }, [categories])

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const params = {
          archived: showArchived,
        }
        if (search.trim()) params.search = search.trim()
        if (activeCategory !== 'All') params.category = activeCategory

        const [notesData, categoriesData] = await Promise.all([
          getNotes(params),
          getCategories(),
        ])

        setNotes(notesData.notes || [])
        setCategories(categoriesData.categories || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load notes. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [activeCategory, search, showArchived])

  async function handleArchive(note) {
    try {
      const { note: updatedNote } = await archiveNote(note._id)
      setNotes((current) =>
        showArchived
          ? current.map((item) => (item._id === updatedNote._id ? updatedNote : item))
          : current.filter((item) => item._id !== updatedNote._id),
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Archive action failed.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleteBusy(true)
    try {
      await deleteNote(deleteTarget._id)
      setNotes((current) => current.filter((note) => note._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed. Please try again.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] overflow-hidden bg-[radial-gradient(circle_at_12%_10%,#a5f3fc,transparent_28%),radial-gradient(circle_at_90%_12%,#ddd6fe,transparent_25%),linear-gradient(135deg,#f8fafc,#ecfeff,#eef2ff)] px-4 py-8 dark:bg-[radial-gradient(circle_at_12%_10%,#164e63,transparent_28%),radial-gradient(circle_at_90%_12%,#312e81,transparent_25%),linear-gradient(135deg,#020617,#0f172a,#111827)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-5 rounded-[2rem] border border-white/60 bg-white/55 p-5 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-cyan-700 dark:text-cyan-200">Notes Workspace</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">
              My Notes
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              Capture tiny thoughts, school projects, work plans, and big ideas in one soft, searchable place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/notes/new')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
          >
            <FilePlus2 size={18} />
            Create New Note
          </button>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-white/60 bg-white/50 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, content, or tags"
                className="h-12 w-full rounded-full border border-white/70 bg-white/70 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
              />
            </label>
            <label className="inline-flex h-12 items-center justify-between gap-3 rounded-full border border-white/70 bg-white/65 px-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200">
              <span>Archived</span>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="h-5 w-5 accent-cyan-600"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categoryTabs.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`relative h-11 shrink-0 rounded-full px-4 text-sm font-black transition duration-300 ${
                  activeCategory === category
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10 dark:bg-white dark:text-slate-950'
                    : 'bg-white/55 text-slate-600 hover:bg-white/85 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid min-h-72 place-items-center text-cyan-700 dark:text-cyan-200">
            <LoaderCircle className="animate-spin" size={32} />
          </div>
        ) : notes.length === 0 ? (
          <section className="mt-6 grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-cyan-300/70 bg-white/45 p-8 text-center backdrop-blur-2xl dark:border-cyan-200/20 dark:bg-white/10">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-100">
                <FilePlus2 size={28} />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
                No notes found
              </h2>
              <p className="mx-auto mt-2 max-w-md leading-7 text-slate-600 dark:text-slate-300">
                Start with a title, a category, and a few tags. The workspace will arrange everything as you go.
              </p>
              <button
                type="button"
                onClick={() => navigate('/notes/new')}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800"
              >
                <FilePlus2 size={18} />
                Create New Note
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onArchive={handleArchive}
                onDelete={setDeleteTarget}
              />
            ))}
          </section>
        )}
      </div>

      <ConfirmModal
        note={deleteTarget}
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </main>
  )
}

export default Notes
