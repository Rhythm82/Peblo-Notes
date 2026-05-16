import mongoose from 'mongoose'
import Note from '../models/Note.js'
import { generateNoteSummary } from '../utils/geminiClient.js'
import generateShareId from '../utils/generateShareId.js'

function normalizeCategory(category) {
  const value = typeof category === 'string' ? category.trim() : ''
  return value || 'General'
}

function normalizeTags(tags) {
  const source = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : []

  return [
    ...new Set(
      source
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  ]
}

function getUserId(req) {
  return req.user._id
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function getClientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()
}

function buildShareUrl(shareId) {
  if (!shareId) return ''

  return `${getClientUrl()}/shared/${shareId}`
}

async function getOwnedNote(req, res) {
  const { id } = req.params

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid note id.' })
    return null
  }

  const note = await Note.findOne({
    _id: id,
    user: getUserId(req),
    isDeleted: false,
  })

  if (!note) {
    res.status(404).json({ message: 'Note not found.' })
    return null
  }

  return note
}

function buildNoteFilter(req) {
  const { archived, category, search, tag } = req.query
  const filter = {
    user: getUserId(req),
    isDeleted: false,
  }

  if (archived === 'true') filter.isArchived = true
  if (archived === 'false' || archived === undefined) filter.isArchived = false

  if (category && category !== 'All') {
    filter.category = String(category).trim()
  }

  if (tag) {
    filter.tags = { $in: [String(tag).trim()] }
  }

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedSearch, 'i')
    filter.$or = [
      { title: searchRegex },
      { content: searchRegex },
      { plainText: searchRegex },
      { tags: searchRegex },
    ]
  }

  return filter
}

async function getNotes(req, res, next) {
  try {
    const filter = buildNoteFilter(req)
    const notes = await Note.find(filter).sort({ lastEditedAt: -1, updatedAt: -1 })
    return res.json({
      notes,
      total: notes.length,
    })
  } catch (error) {
    return next(error)
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await Note.aggregate([
      {
        $match: {
          user: getUserId(req),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'General'] },
          count: 1,
        },
      },
      {
        $sort: {
          name: 1,
        },
      },
    ])

    return res.json({ categories })
  } catch (error) {
    return next(error)
  }
}

async function getNote(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    return res.json({
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function generateAiSummary(req, res) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    const ai = await generateNoteSummary(note)

    note.aiSummary = ai.summary || ''
    note.aiActionItems = ai.action_items || []
    note.aiSuggestedTitle = ai.suggested_title || ''
    note.aiData = {
      detailedSummary: ai.detailed_summary || [],
      keyPoints: ai.key_points || [],
      difficulty: ai.difficulty || 'Beginner',
      quickRevision: ai.quick_revision || '',
      generatedAt: new Date(),
    }

    await note.save()

    return res.json({
      message: 'AI summary generated successfully.',
      ai: {
        summary: note.aiSummary,
        detailed_summary: note.aiData.detailedSummary,
        key_points: note.aiData.keyPoints,
        action_items: note.aiActionItems,
        suggested_title: note.aiSuggestedTitle,
        difficulty: note.aiData.difficulty,
        quick_revision: note.aiData.quickRevision,
      },
      note,
    })
  } catch (error) {
    console.error('AI summary generation failed:', error)
    return res.status(500).json({
      message: 'AI summary generation failed. Please try again.',
    })
  }
}

async function generatePublicShareLink(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    if (!note.shareId) {
      note.shareId = await generateShareId()
    }

    note.isPublic = true
    note.shareCreatedAt = new Date()
    note.shareDisabledAt = undefined
    await note.save()

    return res.json({
      message: 'Public share link generated.',
      shareUrl: buildShareUrl(note.shareId),
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function disablePublicShareLink(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    note.isPublic = false
    note.shareDisabledAt = new Date()
    await note.save()

    return res.json({
      message: 'Public share link disabled.',
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function getPublicShareStatus(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    return res.json({
      isPublic: note.isPublic,
      shareId: note.shareId,
      shareUrl: buildShareUrl(note.shareId),
      shareCreatedAt: note.shareCreatedAt,
      shareDisabledAt: note.shareDisabledAt,
      shareViews: note.shareViews || 0,
      lastSharedViewedAt: note.lastSharedViewedAt,
    })
  } catch (error) {
    return next(error)
  }
}

async function createNote(req, res, next) {
  try {
    const title = req.body.title?.trim()

    if (!title) {
      return res.status(400).json({ message: 'Title is required.' })
    }

    const plainText = req.body.plainText ?? req.body.content ?? ''
    const note = await Note.create({
      user: getUserId(req),
      title,
      content: req.body.content || '',
      plainText,
      category: normalizeCategory(req.body.category),
      tags: normalizeTags(req.body.tags),
      editorData: req.body.editorData || {},
      canvasData: req.body.canvasData || {},
      lastEditedAt: new Date(),
    })

    return res.status(201).json({
      message: 'Note created successfully.',
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function updateNote(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    const allowedFields = ['content', 'plainText', 'editorData', 'canvasData', 'scheduleText']

    if (req.body.title !== undefined) {
      const title = req.body.title?.trim()
      if (!title) {
        return res.status(400).json({ message: 'Title cannot be empty.' })
      }
      note.title = title
    }

    if (req.body.category !== undefined) {
      note.category = normalizeCategory(req.body.category)
    }

    if (req.body.tags !== undefined) {
      note.tags = normalizeTags(req.body.tags)
    }

    if (req.body.scheduledDate !== undefined) {
      note.scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field]
      }
    })

    note.lastEditedAt = new Date()
    await note.save()

    return res.json({
      message: 'Note saved successfully.',
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function toggleArchive(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    note.isArchived = !note.isArchived
    note.lastEditedAt = new Date()
    await note.save()

    return res.json({
      message: note.isArchived ? 'Note archived.' : 'Note restored.',
      note,
    })
  } catch (error) {
    return next(error)
  }
}

async function deleteNote(req, res, next) {
  try {
    const note = await getOwnedNote(req, res)
    if (!note) return null

    await note.deleteOne()

    return res.json({
      message: 'Note deleted permanently.',
      note,
    })
  } catch (error) {
    return next(error)
  }
}

export {
  createNote,
  deleteNote,
  disablePublicShareLink,
  generateAiSummary,
  generatePublicShareLink,
  getCategories,
  getNote,
  getNotes,
  getPublicShareStatus,
  toggleArchive,
  updateNote,
}
