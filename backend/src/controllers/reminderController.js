import mongoose from 'mongoose'
import Note from '../models/Note.js'
import Reminder from '../models/Reminder.js'

function getUserId(req) {
  return req.user._id
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function parseDateOnly(value) {
  if (!value) return null

  const raw = String(value)
  const dateOnly = raw.slice(0, 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null

  const date = new Date(`${dateOnly}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getMonthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    return null
  }

  const [year, monthIndex] = String(month).split('-').map(Number)
  const start = new Date(Date.UTC(year, monthIndex - 1, 1))
  const end = new Date(Date.UTC(year, monthIndex, 1))

  return { start, end }
}

function getTodayRange() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return { start, end }
}

async function ensureOwnedNote(userId, noteId) {
  if (!noteId) return null

  if (!isValidObjectId(noteId)) {
    const error = new Error('Invalid note id.')
    error.statusCode = 400
    throw error
  }

  const note = await Note.findOne({
    _id: noteId,
    user: userId,
    isDeleted: false,
  }).select('_id title category')

  if (!note) {
    const error = new Error('Attached note was not found.')
    error.statusCode = 404
    throw error
  }

  return note
}

function formatReminder(reminder) {
  return {
    _id: reminder._id,
    title: reminder.title,
    description: reminder.description,
    scheduledDate: reminder.scheduledDate,
    isDone: reminder.isDone,
    color: reminder.color,
    note: reminder.note
      ? {
          _id: reminder.note._id,
          title: reminder.note.title,
          category: reminder.note.category,
        }
      : null,
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
  }
}

async function getMonthReminders(req, res, next) {
  try {
    const range = getMonthRange(req.query.month)

    if (!range) {
      return res.status(400).json({ message: 'Month must use YYYY-MM format.' })
    }

    const reminders = await Reminder.find({
      user: getUserId(req),
      scheduledDate: {
        $gte: range.start,
        $lt: range.end,
      },
    })
      .sort({ scheduledDate: 1, createdAt: 1 })
      .populate('note', 'title category')

    return res.json({
      reminders: reminders.map(formatReminder),
    })
  } catch (error) {
    return next(error)
  }
}

async function getTodayReminders(req, res, next) {
  try {
    const { start, end } = getTodayRange()
    const reminders = await Reminder.find({
      user: getUserId(req),
      scheduledDate: {
        $gte: start,
        $lt: end,
      },
    })
      .sort({ isDone: 1, createdAt: 1 })
      .populate('note', 'title category')

    return res.json({
      reminders: reminders.map(formatReminder),
    })
  } catch (error) {
    return next(error)
  }
}

async function createReminder(req, res, next) {
  try {
    const title = req.body.title?.trim()
    const scheduledDate = parseDateOnly(req.body.scheduledDate)

    if (!title) {
      return res.status(400).json({ message: 'Reminder title is required.' })
    }

    if (!scheduledDate) {
      return res.status(400).json({ message: 'A valid scheduled date is required.' })
    }

    const note = await ensureOwnedNote(getUserId(req), req.body.noteId || req.body.note)
    const reminder = await Reminder.create({
      user: getUserId(req),
      note: note?._id || null,
      title,
      description: req.body.description || '',
      scheduledDate,
      color: req.body.color || 'cyan',
    })
    await reminder.populate('note', 'title category')

    return res.status(201).json({
      message: 'Reminder added.',
      reminder: formatReminder(reminder),
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message })
    }

    return next(error)
  }
}

async function updateReminder(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid reminder id.' })
    }

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: getUserId(req),
    })

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found.' })
    }

    if (req.body.title !== undefined) {
      const title = req.body.title?.trim()
      if (!title) return res.status(400).json({ message: 'Reminder title cannot be empty.' })
      reminder.title = title
    }

    if (req.body.description !== undefined) {
      reminder.description = req.body.description || ''
    }

    if (req.body.scheduledDate !== undefined) {
      const scheduledDate = parseDateOnly(req.body.scheduledDate)
      if (!scheduledDate) return res.status(400).json({ message: 'A valid scheduled date is required.' })
      reminder.scheduledDate = scheduledDate
    }

    if (req.body.note !== undefined || req.body.noteId !== undefined) {
      const nextNoteId = req.body.noteId ?? req.body.note
      const note = await ensureOwnedNote(getUserId(req), nextNoteId)
      reminder.note = note?._id || null
    }

    if (req.body.isDone !== undefined) {
      reminder.isDone = Boolean(req.body.isDone)
    }

    if (req.body.color !== undefined) {
      reminder.color = req.body.color || 'cyan'
    }

    await reminder.save()
    await reminder.populate('note', 'title category')

    return res.json({
      message: 'Reminder updated.',
      reminder: formatReminder(reminder),
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message })
    }

    return next(error)
  }
}

async function toggleReminderDone(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid reminder id.' })
    }

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: getUserId(req),
    })

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found.' })
    }

    reminder.isDone = !reminder.isDone
    await reminder.save()
    await reminder.populate('note', 'title category')

    return res.json({
      message: reminder.isDone ? 'Reminder marked done.' : 'Reminder reopened.',
      reminder: formatReminder(reminder),
    })
  } catch (error) {
    return next(error)
  }
}

async function deleteReminder(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid reminder id.' })
    }

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: getUserId(req),
    })

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found.' })
    }

    await reminder.deleteOne()

    return res.json({
      message: 'Reminder deleted.',
      reminder: formatReminder(reminder),
    })
  } catch (error) {
    return next(error)
  }
}

export {
  createReminder,
  deleteReminder,
  getMonthReminders,
  getTodayReminders,
  toggleReminderDone,
  updateReminder,
}
