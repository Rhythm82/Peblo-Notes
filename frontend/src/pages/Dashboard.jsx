import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  CheckCircle2,
  Clock,
  Edit3,
  FilePlus2,
  FileText,
  LoaderCircle,
  NotebookPen,
  PenLine,
  Plus,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getDashboardInsights } from '../services/dashboardApi'
import {
  createReminder,
  deleteReminder,
  getMonthReminders,
  getTodayReminders,
  toggleReminderDone,
} from '../services/reminderApi'

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
})

function formatDate(value) {
  if (!value) return 'Not yet'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function dateKey(value) {
  const date = value ? new Date(value) : new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthKey(value) {
  const date = value ? new Date(value) : new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getMostActiveDay(activity = []) {
  if (!activity.length) return null

  return activity.reduce((best, day) => {
    const total = day.created + day.edited + day.aiGenerated
    const bestTotal = best.created + best.edited + best.aiGenerated
    return total > bestTotal ? day : best
  }, activity[0])
}

function getMonthDays(baseDate = new Date()) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstDay.getDay()

  return [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1)
      return {
        key: dateKey(date),
        date,
        label: index + 1,
      }
    }),
  ]
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-black text-cyan-700 dark:text-cyan-200">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function LoadingDashboard() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[linear-gradient(135deg,#f8fafc,#ecfeff,#f5f3ff)] px-4 py-8 dark:bg-[linear-gradient(135deg,#020617,#0f172a,#111827)]">
      <div className="mx-auto max-w-7xl">
        <div className="grid min-h-96 place-items-center rounded-[2rem] border border-white/60 bg-white/55 text-cyan-700 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:text-cyan-200">
          <LoaderCircle className="animate-spin" size={34} />
        </div>
      </div>
    </main>
  )
}

function ReminderModal({
  date,
  noteId,
  noteOptions,
  description,
  onCancel,
  onDescriptionChange,
  onNoteChange,
  onSave,
  onTitleChange,
  saving,
  title,
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <motion.section
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-cyan-200/80 via-white/80 to-violet-200/80 p-[1px] shadow-2xl shadow-cyan-950/25 dark:border-white/10 dark:from-cyan-400/20 dark:via-white/10 dark:to-violet-400/20"
      >
        <div className="rounded-[1.95rem] bg-white/88 p-5 backdrop-blur-2xl dark:bg-slate-950/88 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-cyan-700 dark:text-cyan-200">
                {dateFormatter.format(new Date(`${date}T00:00:00`))}
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                Schedule a learning task
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/60 text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              aria-label="Close reminder modal"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Add task"
              className="h-12 rounded-2xl border border-cyan-100 bg-white/75 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
            />
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Add small details or study plan..."
              rows={4}
              className="resize-none rounded-2xl border border-cyan-100 bg-white/75 px-4 py-3 text-sm font-bold leading-6 text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
            />
            <select
              value={noteId}
              onChange={(event) => onNoteChange(event.target.value)}
              className="h-12 rounded-2xl border border-cyan-100 bg-white/75 px-4 text-sm font-bold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-950/35 dark:text-white"
            >
              <option value="">No attached note</option>
              {noteOptions.map((note) => (
                <option key={note._id} value={note._id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 bg-white/60 px-5 text-sm font-black text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}
              Save Reminder
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function ReminderCard({ reminder, onDelete, onToggle }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        reminder.isDone
          ? 'border-emerald-100 bg-emerald-50/50 opacity-75 dark:border-emerald-300/15 dark:bg-emerald-300/10'
          : 'border-cyan-100 bg-cyan-50/70 dark:border-cyan-300/20 dark:bg-cyan-300/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onToggle(reminder._id)}
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/70 bg-white/70 text-cyan-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-cyan-100"
          aria-label={reminder.isDone ? 'Reopen reminder' : 'Mark reminder done'}
          title={reminder.isDone ? 'Reopen' : 'Mark done'}
        >
          <CheckCircle2 size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`font-black text-slate-950 dark:text-white ${
              reminder.isDone ? 'line-through decoration-2' : ''
            }`}
          >
            {reminder.title}
          </p>
          {reminder.description && (
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
              {reminder.description}
            </p>
          )}
          {reminder.note && (
            <Link
              to={`/notes/${reminder.note._id}`}
              className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black text-cyan-800 transition hover:bg-white dark:bg-white/10 dark:text-cyan-100"
            >
              {reminder.note.title}
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(reminder._id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200"
          aria-label="Delete reminder"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function TodayReminderPopover({ reminders, onDelete, onToggle }) {
  return (
    <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/60 bg-white/88 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/92">
      <h3 className="text-lg font-black text-slate-950 dark:text-white">Today's reminders</h3>
      <div className="mt-3 grid max-h-80 gap-3 overflow-auto pr-1">
        {reminders.length ? (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/60 p-4 text-sm font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
            No reminders for today.
          </p>
        )}
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [insights, setInsights] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()))
  const [monthReminders, setMonthReminders] = useState([])
  const [todayReminders, setTodayReminders] = useState([])
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDescription, setReminderDescription] = useState('')
  const [reminderNoteId, setReminderNoteId] = useState('')
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [bellOpen, setBellOpen] = useState(false)

  async function loadInsights(offset = weekOffset) {
    setLoading(true)
    setError('')

    try {
      const data = await getDashboardInsights(offset)
      setInsights(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard insights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => loadInsights(weekOffset))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  async function loadReminderData(date = selectedDate) {
    const [monthData, todayData] = await Promise.all([
      getMonthReminders(monthKey(new Date(`${date}T00:00:00`))),
      getTodayReminders(),
    ])

    setMonthReminders(monthData.reminders || [])
    setTodayReminders(todayData.reminders || [])
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadReminderData(selectedDate).catch((err) => {
        setError(err.response?.data?.message || 'Could not load reminders.')
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const stats = insights?.stats || {}
  const recentNotes = insights?.recentlyEditedNotes || []
  const mostUsedTags = insights?.mostUsedTags || []
  const weeklyActivity = insights?.weeklyActivity || []
  const noteOptions = insights?.noteOptions || []
  const latestAiNote = insights?.latestAiNote
  const totalNotes = stats.totalNotes || 0
  const mostActiveDay = getMostActiveDay(weeklyActivity)
  const mostActiveTotal = mostActiveDay
    ? mostActiveDay.created + mostActiveDay.edited + mostActiveDay.aiGenerated
    : 0

  const chartData = weeklyActivity.map((day) => ({
    ...day,
    label: dayFormatter.format(new Date(`${day.date}T00:00:00`)),
  }))

  const scheduledByDate = useMemo(() => {
    return monthReminders.reduce((map, item) => {
      const key = dateKey(item.scheduledDate)
      map.set(key, [...(map.get(key) || []), item])
      return map
    }, new Map())
  }, [monthReminders])

  const selectedSchedules = scheduledByDate.get(selectedDate) || []
  const monthDays = getMonthDays(new Date(`${selectedDate}T00:00:00`))
  const incompleteTodayCount = todayReminders.filter((reminder) => !reminder.isDone).length
  const statCards = [
    {
      label: 'Total Notes',
      value: stats.totalNotes || 0,
      hint: totalNotes ? 'Ideas saved in your vault' : 'Start with your first note',
      icon: FileText,
      tone: 'from-cyan-500 to-blue-600',
    },
    {
      label: 'Recently Edited',
      value: stats.recentlyEditedCount || 0,
      hint: 'Updated in the last 7 days',
      icon: Edit3,
      tone: 'from-blue-500 to-violet-600',
    },
    {
      label: 'AI Summaries',
      value: stats.aiUsageCount || 0,
      hint: 'Notes with AI study help',
      icon: Brain,
      tone: 'from-violet-500 to-fuchsia-600',
    },
    {
      label: 'Public Links',
      value: stats.publicLinksCount || 0,
      hint: 'Readable share links active',
      icon: Share2,
      tone: 'from-sky-500 to-cyan-600',
    },
    {
      label: 'Archived',
      value: stats.archivedCount || 0,
      hint: 'Quietly stored away',
      icon: Archive,
      tone: 'from-slate-600 to-cyan-700',
    },
  ]

  function openReminderModal(date = selectedDate) {
    setSelectedDate(date)
    setReminderTitle('')
    setReminderDescription('')
    setReminderNoteId('')
    setReminderMessage('')
    setReminderModalOpen(true)
  }

  async function refreshReminders() {
    await Promise.all([loadReminderData(selectedDate), loadInsights(weekOffset)])
  }

  async function handleReminderSave() {
    if (!reminderTitle.trim()) {
      setReminderMessage('Add a task title first.')
      return
    }

    setReminderSaving(true)
    setReminderMessage('')

    try {
      await createReminder({
        title: reminderTitle,
        description: reminderDescription,
        scheduledDate: selectedDate,
        noteId: reminderNoteId || undefined,
      })
      setReminderModalOpen(false)
      setReminderMessage('Reminder added.')
      await refreshReminders()
    } catch (err) {
      setReminderMessage(err.response?.data?.message || 'Could not save this reminder.')
    } finally {
      setReminderSaving(false)
    }
  }

  async function handleToggleReminder(id) {
    await toggleReminderDone(id)
    await refreshReminders()
  }

  async function handleDeleteReminder(id) {
    await deleteReminder(id)
    await refreshReminders()
  }

  if (loading && !insights) return <LoadingDashboard />

  return (
    <main className="min-h-[calc(100vh-73px)] overflow-hidden bg-[radial-gradient(circle_at_12%_8%,#bae6fd,transparent_28%),radial-gradient(circle_at_90%_12%,#ddd6fe,transparent_24%),linear-gradient(135deg,#f8fafc,#ecfeff,#f5f3ff)] px-4 py-8 dark:bg-[radial-gradient(circle_at_12%_8%,#155e75,transparent_28%),radial-gradient(circle_at_90%_12%,#4c1d95,transparent_24%),linear-gradient(135deg,#020617,#0f172a,#111827)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {error && (
          <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </p>
        )}

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/65 bg-white/58 p-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-400/15" />
          <div className="pointer-events-none absolute bottom-8 right-16 hidden h-20 w-20 animate-pulse rounded-[1.5rem] border border-white/70 bg-white/35 rotate-6 backdrop-blur-xl md:block dark:border-white/10 dark:bg-white/10" />
          <div className="pointer-events-none absolute right-36 top-12 hidden h-10 w-10 rounded-full bg-violet-300/60 shadow-xl shadow-violet-300/30 md:block dark:bg-violet-400/20" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-100/85 px-3 py-1 text-sm font-black text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100">
                <Sparkles size={15} />
                Productivity Insights
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
                Hi {user?.name || 'learner'}, your notes are ready.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                Track your ideas, review your learning, and turn notes into smart study insights.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
                <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-cyan-700 dark:bg-white dark:text-slate-950" to="/notes">
                  <FileText size={18} />
                  Open Notes
                </Link>
                <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/68 px-5 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-200" to="/notes/new">
                  <FilePlus2 size={18} />
                  New Note
                </Link>
                <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/75 px-5 text-sm font-black text-cyan-800 transition hover:-translate-y-0.5 hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100" to="/notes">
                  <WandSparkles size={18} />
                  Generate AI Summary
                </Link>
                <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-violet-200/70 bg-violet-50/75 px-5 text-sm font-black text-violet-800 transition hover:-translate-y-0.5 hover:bg-violet-100 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-100" to="/notes">
                  <Share2 size={18} />
                  Public Links
                </Link>
              </div>
            </div>

            <div className="relative min-h-56 rounded-[1.75rem] border border-white/70 bg-white/48 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/30">
              <div className="absolute right-5 top-5 rounded-2xl bg-yellow-100 px-4 py-3 text-sm font-black text-yellow-800 shadow-lg rotate-3">
                Review
              </div>
              <div className="absolute bottom-6 right-8 rounded-2xl bg-violet-100 px-4 py-3 text-sm font-black text-violet-800 shadow-lg -rotate-6">
                Share
              </div>
              <div className="mt-8 rounded-2xl bg-white/80 p-4 shadow-lg dark:bg-white/10">
                <div className="flex items-center gap-3">
                  <PenLine className="text-cyan-700 dark:text-cyan-200" />
                  <div className="h-3 flex-1 rounded-full bg-cyan-100 dark:bg-cyan-300/20" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-11/12 rounded-full bg-slate-200 dark:bg-white/15" />
                  <div className="h-3 w-8/12 rounded-full bg-slate-200 dark:bg-white/15" />
                  <div className="h-3 w-10/12 rounded-full bg-slate-200 dark:bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {totalNotes === 0 && (
          <section className="mt-6 rounded-[1.75rem] border border-cyan-200/70 bg-white/65 p-6 text-center shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-cyan-300/15 dark:bg-white/10">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Your learning journey starts here.
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Create your first note and this dashboard will bloom with real study insights.
            </p>
            <Link
              to="/notes/new"
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800"
            >
              <FilePlus2 size={18} />
              Create your first note
            </Link>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map(({ label, value, hint, icon: Icon, tone }, index) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="group rounded-[1.5rem] border border-white/60 bg-white/58 p-5 shadow-sm backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/10 dark:border-white/10 dark:bg-white/10"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
                <Icon size={21} />
              </div>
              <p className="mt-5 text-4xl font-black text-slate-950 dark:text-white">{value}</p>
              <p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">{label}</p>
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{hint}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="rounded-[1.75rem] border border-white/60 bg-white/62 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
            <SectionTitle eyebrow="Study rhythm" title="Weekly Activity">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current + 1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/65 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  aria-label="Previous week"
                  title="Previous week"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => Math.max(0, current - 1))}
                  disabled={weekOffset === 0}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/65 text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  aria-label="Next week"
                  title="Next week"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </SectionTitle>
            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: '1px solid #bae6fd',
                      boxShadow: '0 18px 45px rgba(15,23,42,.14)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="created" name="Created" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="edited" name="Edited" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="aiGenerated" name="AI" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 rounded-2xl bg-cyan-50/75 px-4 py-3 text-sm font-bold text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100">
              {mostActiveTotal
                ? `Your most active day was ${dayFormatter.format(new Date(`${mostActiveDay.date}T00:00:00`))} with ${mostActiveTotal} study updates.`
                : 'Your activity chart is waiting for your first note update.'}
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-white/60 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 dark:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-cyan-200">AI Learning Insights</p>
                <h2 className="mt-2 text-3xl font-black">{stats.aiUsageCount || 0}</h2>
                <p className="mt-1 text-sm font-bold text-slate-300">AI summaries generated</p>
              </div>
              <Brain className="text-cyan-200" size={30} />
            </div>
            <p className="mt-5 leading-7 text-slate-200">AI is helping you revise faster with simple summaries, key points, and action items.</p>
            {latestAiNote ? (
              <Link
                to={`/notes/${latestAiNote._id}`}
                className="mt-5 block rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
              >
                <p className="text-sm font-black text-cyan-100">{latestAiNote.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{latestAiNote.aiSummary}</p>
              </Link>
            ) : (
              <Link
                to="/notes"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950"
              >
                Use AI again
                <WandSparkles size={16} />
              </Link>
            )}
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.75rem] border border-white/60 bg-white/62 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
            <SectionTitle eyebrow="Quick access" title="Recently Edited Notes" />
            <div className="grid gap-3">
              {recentNotes.length ? (
                recentNotes.map((note) => (
                  <div
                    key={note._id}
                    className="grid gap-3 rounded-2xl border border-white/70 bg-white/58 p-4 transition hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-slate-950/30 dark:hover:bg-white/10 md:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{note.title}</h3>
                      <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {note.preview || stripHtml(note.content) || 'No preview yet'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100">
                          {note.category || 'General'}
                        </span>
                        {(note.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            #{tag}
                          </span>
                        ))}
                        <span className="text-xs font-bold text-slate-400">Edited {formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 md:items-center">
                      <Link to={`/notes/${note._id}`} className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                        Open
                      </Link>
                      <Link to={`/notes/${note._id}/edit`} className="inline-flex h-10 items-center justify-center rounded-full border border-white/70 bg-white/60 px-4 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                        Edit
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/60 p-5 text-sm font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                  No edited notes yet. Create a note and it will appear here.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/60 bg-white/62 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
            <SectionTitle eyebrow="Learning themes" title="Most-used Tags" />
            {mostUsedTags.length ? (
              <div className="space-y-3">
                {mostUsedTags.map((item) => {
                  const maxCount = mostUsedTags[0]?.count || 1
                  const width = `${Math.max(16, (item.count / maxCount) * 100)}%`

                  return (
                    <div key={item.tag} className="rounded-2xl border border-white/70 bg-white/58 p-4 dark:border-white/10 dark:bg-slate-950/30">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                          <Tag size={16} className="text-cyan-700 dark:text-cyan-200" />
                          #{item.tag}
                        </p>
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100">
                          {item.count}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/60 p-5 text-sm font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                Add tags to your notes to reveal your favorite learning themes.
              </p>
            )}
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.75rem] border border-white/60 bg-white/62 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
            <SectionTitle eyebrow="Plan revision" title="Learning Calendar">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBellOpen((current) => !current)}
                  className="relative grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/65 text-slate-700 shadow-lg shadow-cyan-900/10 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  aria-label="Today's reminders"
                  title="Today's reminders"
                >
                  <Bell size={19} />
                  {incompleteTodayCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-3 w-3 animate-ping rounded-full bg-rose-500" />
                  )}
                  {incompleteTodayCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-rose-500" />
                  )}
                </button>
                {bellOpen && (
                  <TodayReminderPopover
                    reminders={todayReminders}
                    onDelete={handleDeleteReminder}
                    onToggle={handleToggleReminder}
                  />
                )}
              </div>
            </SectionTitle>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-500 dark:text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const dayReminders = day.date ? scheduledByDate.get(day.key) || [] : []
                const hasIncomplete = dayReminders.some((reminder) => !reminder.isDone)
                const isToday = day.key === dateKey(new Date())

                return day.date ? (
                  <button
                    type="button"
                    key={day.key}
                    onClick={() => openReminderModal(day.key)}
                    className={`relative aspect-square rounded-2xl border text-sm font-black transition hover:-translate-y-0.5 ${
                      selectedDate === day.key
                        ? 'border-cyan-300 bg-cyan-600 text-white shadow-lg shadow-cyan-700/20'
                        : 'border-white/70 bg-white/55 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200'
                    } ${isToday ? 'ring-2 ring-violet-300/70 ring-offset-2 ring-offset-transparent' : ''}`}
                  >
                    {day.label}
                    {dayReminders.length > 0 && (
                      <span
                        className={`absolute bottom-1.5 left-1/2 inline-flex h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                          hasIncomplete
                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                            : 'bg-emerald-400 text-white'
                        }`}
                      >
                        {dayReminders.length}
                      </span>
                    )}
                  </button>
                ) : (
                  <span key={day.key} />
                )
              })}
            </div>
            {reminderMessage && (
              <p className="mt-4 rounded-2xl bg-cyan-50/75 px-4 py-3 text-sm font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-100">
                {reminderMessage}
              </p>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-white/60 bg-white/62 p-5 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
            <SectionTitle
              eyebrow={dateFormatter.format(new Date(`${selectedDate}T00:00:00`))}
              title="Scheduled Tasks"
            >
              <button
                type="button"
                onClick={() => openReminderModal(selectedDate)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950"
              >
                <Plus size={16} />
                Add reminder
              </button>
            </SectionTitle>
            <div className="grid gap-3">
              {selectedSchedules.length ? (
                selectedSchedules.map((item) => (
                  <ReminderCard
                    key={item._id}
                    reminder={item}
                    onDelete={handleDeleteReminder}
                    onToggle={handleToggleReminder}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/60 p-4 text-sm font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                  Pick a day and schedule your first learning task.
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/55 p-4 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              <Clock size={18} className="text-cyan-700 dark:text-cyan-200" />
              Reminder dots turn bright when tasks are still open and calm when everything is done.
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/60 bg-white/62 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
            <NotebookPen className="text-cyan-700 dark:text-cyan-200" />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">How smart notes help</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Write note {'=>'} organize tags {'=>'} generate AI summary {'=>'} share and revise.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/60 bg-white/62 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
            <Sparkles className="text-violet-600 dark:text-violet-200" />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Tip of the day</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Try tagging notes by subject so your revision themes appear automatically.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/60 bg-white/62 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
            <WandSparkles className="text-cyan-700 dark:text-cyan-200" />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Magic Note Demo</h2>
            <p className="mt-2 rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100">
              Photosynthesis {'=>'} plants make food using sunlight {'=>'} revise key steps.
            </p>
          </article>
        </section>
      </div>

      {reminderModalOpen && (
        <ReminderModal
          date={selectedDate}
          noteId={reminderNoteId}
          noteOptions={noteOptions}
          description={reminderDescription}
          onCancel={() => setReminderModalOpen(false)}
          onDescriptionChange={setReminderDescription}
          onNoteChange={setReminderNoteId}
          onSave={handleReminderSave}
          onTitleChange={setReminderTitle}
          saving={reminderSaving}
          title={reminderTitle}
        />
      )}
    </main>
  )
}

export default Dashboard
