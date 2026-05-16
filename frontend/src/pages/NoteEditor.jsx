import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bold,
  Highlighter,
  ImagePlus,
  List,
  ListOrdered,
  LoaderCircle,
  Save,
  Shapes,
  Type,
  WandSparkles,
  X,
} from 'lucide-react'
import { createNote, generateAiSummary, getNote, updateNote } from '../services/noteApi'

const emptyForm = {
  title: '',
  category: 'General',
  tagsText: '',
  content: '',
}

function normalizeTags(tagsText) {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function sanitizeHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html

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

function getPlainText(html) {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.textContent?.replace(/\s+/g, ' ').trim() || ''
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function buildPayload(form) {
  const content = sanitizeHtml(form.content)

  return {
    title: form.title,
    category: form.category,
    tags: normalizeTags(form.tagsText),
    content,
    plainText: getPlainText(content),
  }
}

function ToolbarButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 ${
        active
          ? 'border-cyan-200 bg-cyan-600 text-white shadow-lg shadow-cyan-700/20'
          : 'border-white/70 bg-white/65 text-slate-700 hover:text-cyan-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:text-cyan-100'
      }`}
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  )
}

function NoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(isNew ? 'Unsaved changes' : 'Saved')
  const [error, setError] = useState('')
  const [titleSuggesting, setTitleSuggesting] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const savedRangeRef = useRef(null)
  const saveCounterRef = useRef(0)

  const canSave = useMemo(() => form.title.trim().length > 0 && !saving, [form.title, saving])

  useEffect(() => {
    if (loading || dirty || !editorRef.current) return

    editorRef.current.innerHTML = form.content
  }, [dirty, form.content, loading])

  useEffect(() => {
    if (isNew) return undefined

    let isMounted = true

    async function loadNote() {
      setLoading(true)
      setError('')

      try {
        const { note } = await getNote(id)
        if (!isMounted) return

        setForm({
          title: note.title || '',
          category: note.category || 'General',
          tagsText: (note.tags || []).join(', '),
          content: sanitizeHtml(note.content || note.plainText || ''),
        })
        setStatus('Saved')
        setDirty(false)
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not load this note.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadNote()

    return () => {
      isMounted = false
    }
  }, [id, isNew])

  useEffect(() => {
    if (isNew || !dirty || loading || !form.title.trim()) return undefined

    const timer = setTimeout(async () => {
      const saveId = saveCounterRef.current + 1
      saveCounterRef.current = saveId
      setSaving(true)
      setStatus('Saving...')
      setError('')

      try {
        await updateNote(id, buildPayload(form))
        if (saveCounterRef.current === saveId) {
          setStatus('Saved')
          setDirty(false)
        }
      } catch (err) {
        setStatus('Unsaved changes')
        setError(err.response?.data?.message || 'Auto-save failed. Your changes are still on screen.')
      } finally {
        if (saveCounterRef.current === saveId) {
          setSaving(false)
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [dirty, form, id, isNew, loading])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setDirty(true)
    setStatus('Unsaved changes')
  }

  function syncEditor() {
    if (!editorRef.current) return

    updateField('content', sanitizeHtml(editorRef.current.innerHTML))
  }

  async function handleSuggestTitle() {
    if (isNew) {
      setError('Save the note first before using AI title suggestion.')
      return
    }

    if (!getPlainText(form.content)) {
      setError('Add note content before using AI title suggestion.')
      return
    }

    setTitleSuggesting(true)
    setError('')
    setStatus('Suggesting title...')

    try {
      const { ai } = await generateAiSummary(id)
      const suggestedTitle = ai?.suggested_title?.trim()

      if (!suggestedTitle) {
        setError('AI could not suggest a title for this note.')
        setStatus('Unsaved changes')
        return
      }

      updateField('title', suggestedTitle)
      setStatus('Unsaved changes')
    } catch (err) {
      setStatus('Unsaved changes')
      setError(err.response?.data?.message || 'AI title suggestion failed. Please try again.')
    } finally {
      setTitleSuggesting(false)
    }
  }

  function saveSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()

    if (!editor || !selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange()
    }
  }

  function restoreSelection() {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()

    const selection = window.getSelection()
    if (!selection) return

    selection.removeAllRanges()

    if (savedRangeRef.current) {
      selection.addRange(savedRangeRef.current)
      return
    }

    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.addRange(range)
  }

  function runCommand(command, value = null) {
    restoreSelection()
    document.execCommand(command, false, value)
    syncEditor()
    saveSelection()
  }

  function insertHtmlAtCursor(html) {
    restoreSelection()
    document.execCommand('insertHTML', false, html)
    syncEditor()
    saveSelection()
  }

  function insertShape(shape) {
    const isCircle = shape === 'circle'
    const radius = isCircle ? '9999px' : '14px'
    const label = isCircle ? 'Circle shape' : 'Square shape'

    insertHtmlAtCursor(
      `<span contenteditable="false" data-note-shape="${shape}" aria-label="${label}" style="display:inline-block;width:72px;height:72px;border-radius:${radius};background:linear-gradient(135deg,#67e8f9,#a78bfa);box-shadow:0 12px 30px rgba(8,145,178,.22);vertical-align:middle;margin:8px;"></span>&nbsp;`,
    )
    setShapeMenuOpen(false)
  }

  function handleImagePick(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError('Please choose an image under 1.5 MB for now.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const alt = escapeAttribute(file.name)

      insertHtmlAtCursor(
        `<img src="${src}" alt="${alt}" data-note-image="true" style="display:block;max-width:min(100%,520px);height:auto;border-radius:22px;margin:14px 0;box-shadow:0 18px 45px rgba(15,23,42,.18);" />`,
      )
    }
    reader.onerror = () => setError('Could not read this image. Please try another one.')
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Please add a title before saving.')
      return
    }

    setSaving(true)
    setStatus('Saving...')
    setError('')

    try {
      if (isNew) {
        const { note } = await createNote(buildPayload(form))
        setStatus('Saved')
        navigate(`/notes/${note._id}`)
      } else {
        const { note } = await updateNote(id, buildPayload(form))
        setStatus('Saved')
        setDirty(false)
        navigate(`/notes/${note._id}`)
      }
    } catch (err) {
      setStatus('Unsaved changes')
      setError(err.response?.data?.message || 'Could not save this note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_10%_8%,#bae6fd,transparent_30%),radial-gradient(circle_at_90%_12%,#e9d5ff,transparent_24%),linear-gradient(135deg,#f8fafc,#ecfeff,#f5f3ff)] px-4 py-6 dark:bg-[radial-gradient(circle_at_10%_8%,#155e75,transparent_30%),radial-gradient(circle_at_90%_12%,#4c1d95,transparent_24%),linear-gradient(135deg,#020617,#0f172a,#111827)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={isNew ? '/notes' : `/notes/${id}`}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 text-sm font-bold text-slate-700 backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          >
            <ArrowLeft size={17} />
            Back
          </Link>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-black text-slate-600 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
            {saving && <LoaderCircle className="animate-spin text-cyan-600 dark:text-cyan-200" size={16} />}
            {status}
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/65 bg-white/58 p-4 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-6">
          {loading ? (
            <div className="grid min-h-96 place-items-center text-cyan-700 dark:text-cyan-200">
              <LoaderCircle className="animate-spin" size={32} />
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_17rem_17rem]">
                <label className="block">
                  <span className="text-sm font-black text-slate-600 dark:text-slate-300">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    placeholder="Name this note"
                    className="mt-2 h-13 w-full rounded-[1.25rem] border border-white/70 bg-white/70 px-4 text-lg font-black text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
                  />
                  <button
                    type="button"
                    onClick={handleSuggestTitle}
                    disabled={titleSuggesting}
                    className="mt-2 inline-flex h-10 items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-4 text-xs font-black text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:bg-cyan-300/15"
                  >
                    {titleSuggesting ? (
                      <LoaderCircle className="animate-spin" size={15} />
                    ) : (
                      <WandSparkles size={15} />
                    )}
                    Suggest Title
                  </button>
                </label>
                <label className="block">
                  <span className="text-sm font-black text-slate-600 dark:text-slate-300">Category</span>
                  <input
                    value={form.category}
                    onChange={(event) => updateField('category', event.target.value)}
                    placeholder="General"
                    className="mt-2 h-13 w-full rounded-[1.25rem] border border-white/70 bg-white/70 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-slate-600 dark:text-slate-300">Tags</span>
                  <input
                    value={form.tagsText}
                    onChange={(event) => updateField('tagsText', event.target.value)}
                    placeholder="ideas, school, project"
                    className="mt-2 h-13 w-full rounded-[1.25rem] border border-white/70 bg-white/70 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:focus:ring-cyan-400/15"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-white/70 bg-white/45 p-2 dark:border-white/10 dark:bg-slate-950/25">
                <ToolbarButton icon={Bold} label="Bold" onClick={() => runCommand('bold')} />
                <ToolbarButton icon={List} label="Bullets" onClick={() => runCommand('insertUnorderedList')} />
                <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => runCommand('insertOrderedList')} />
                <ToolbarButton icon={Highlighter} label="Highlight" onClick={() => runCommand('backColor', '#fde68a')} />
                <ToolbarButton icon={Type} label="Large text" onClick={() => runCommand('fontSize', '5')} />
                <div className="relative">
                  <ToolbarButton
                    icon={Shapes}
                    label="Add shape"
                    active={shapeMenuOpen}
                    onClick={() => {
                      saveSelection()
                      setShapeMenuOpen((current) => !current)
                    }}
                  />
                  {shapeMenuOpen && (
                    <div className="absolute left-0 top-12 z-20 grid w-44 gap-2 rounded-2xl border border-white/70 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                      <button
                        type="button"
                        onClick={() => insertShape('square')}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        <span className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-300 to-violet-400" />
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => insertShape('circle')}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-300 to-violet-400" />
                        Circle
                      </button>
                    </div>
                  )}
                </div>
                <ToolbarButton
                  icon={ImagePlus}
                  label="Add image"
                  onClick={() => {
                    saveSelection()
                    fileInputRef.current?.click()
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="hidden"
                />
              </div>

              <div className="mt-5 block">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditor}
                  onBlur={saveSelection}
                  onKeyUp={saveSelection}
                  onMouseUp={saveSelection}
                  onPaste={() => setTimeout(syncEditor, 0)}
                  data-placeholder="Start writing here..."
                  className="note-rich-editor min-h-[28rem] w-full overflow-auto rounded-[1.75rem] border border-white/70 bg-white/70 p-5 text-base leading-8 text-slate-800 outline-none transition empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/60 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:focus:ring-cyan-400/15"
                />
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-300/10 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  to={isNew ? '/notes' : `/notes/${id}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/60 px-5 text-sm font-black text-slate-700 transition hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                >
                  <X size={17} />
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-xl shadow-slate-950/10 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
                >
                  {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
                  Save
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default NoteEditor
