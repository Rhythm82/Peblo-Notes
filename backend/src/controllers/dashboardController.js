import Note from '../models/Note.js'
import Reminder from '../models/Reminder.js'

const DAY_MS = 24 * 60 * 60 * 1000

function getDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function buildWeekRange(weekOffset = 0) {
  const today = startOfUtcDay(new Date())
  const end = new Date(today.getTime() - weekOffset * 7 * DAY_MS)
  const start = new Date(end.getTime() - 6 * DAY_MS)
  const afterEnd = new Date(end.getTime() + DAY_MS)

  return { start, end, afterEnd }
}

function buildEmptyActivity(start) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS)

    return {
      date: getDateKey(date),
      created: 0,
      edited: 0,
      aiGenerated: 0,
    }
  })
}

function mergeCounts(activity, counts, field) {
  const byDate = new Map(activity.map((day) => [day.date, day]))

  counts.forEach((item) => {
    const dateKey = item._id
    const day = byDate.get(dateKey)

    if (day) {
      day[field] = item.count
    }
  })

  return activity
}

function parseWeekOffset(value) {
  const offset = Number.parseInt(value, 10)
  return Number.isFinite(offset) && offset >= 0 ? offset : 0
}

function getTodayRange() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return { start, end }
}

async function getWeeklyActivityForUser(userId, weekOffset = 0) {
  const { start, afterEnd } = buildWeekRange(weekOffset)
  let activity = buildEmptyActivity(start)
  const baseMatch = {
    user: userId,
    isDeleted: false,
  }

  const groupByDate = (field) => [
    {
      $match: {
        ...baseMatch,
        [field]: {
          $gte: start,
          $lt: afterEnd,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: `$${field}`,
            format: '%Y-%m-%d',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]

  const aiGeneratedPipeline = [
    {
      $match: {
        ...baseMatch,
        $or: [
          {
            'aiData.generatedAt': {
              $gte: start,
              $lt: afterEnd,
            },
          },
          {
            aiSummary: {
              $exists: true,
              $ne: '',
            },
            'aiData.generatedAt': {
              $exists: false,
            },
            updatedAt: {
              $gte: start,
              $lt: afterEnd,
            },
          },
        ],
      },
    },
    {
      $project: {
        aiDate: {
          $ifNull: ['$aiData.generatedAt', '$updatedAt'],
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$aiDate',
            format: '%Y-%m-%d',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]

  const [createdCounts, editedCounts, aiCounts] = await Promise.all([
    Note.aggregate(groupByDate('createdAt')),
    Note.aggregate(groupByDate('updatedAt')),
    Note.aggregate(aiGeneratedPipeline),
  ])

  activity = mergeCounts(activity, createdCounts, 'created')
  activity = mergeCounts(activity, editedCounts, 'edited')
  activity = mergeCounts(activity, aiCounts, 'aiGenerated')

  return activity
}

async function getDashboardInsights(req, res, next) {
  try {
    const userId = req.user._id
    const weekOffset = parseWeekOffset(req.query.weekOffset)
    const baseFilter = {
      user: userId,
      isDeleted: false,
    }
    const sevenDaysAgo = new Date(Date.now() - 6 * DAY_MS)
    const todayRange = getTodayRange()

    const [
      totalNotes,
      recentlyEditedCount,
      aiUsageCount,
      publicLinksCount,
      archivedCount,
      recentlyEditedNotes,
      mostUsedTags,
      weeklyActivity,
      calendarNotes,
      noteOptions,
      latestAiNote,
      todayReminderCount,
    ] = await Promise.all([
      Note.countDocuments(baseFilter),
      Note.countDocuments({
        ...baseFilter,
        updatedAt: {
          $gte: sevenDaysAgo,
        },
      }),
      Note.countDocuments({
        ...baseFilter,
        aiSummary: {
          $exists: true,
          $ne: '',
        },
      }),
      Note.countDocuments({
        ...baseFilter,
        isPublic: true,
      }),
      Note.countDocuments({
        ...baseFilter,
        isArchived: true,
      }),
      Note.find(baseFilter)
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('title category tags updatedAt plainText content')
        .lean(),
      Note.aggregate([
        { $match: baseFilter },
        { $unwind: '$tags' },
        {
          $group: {
            _id: {
              $toLower: '$tags',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 6 },
        {
          $project: {
            _id: 0,
            tag: '$_id',
            count: 1,
          },
        },
      ]),
      getWeeklyActivityForUser(userId, weekOffset),
      Reminder.find({
        user: userId,
      })
        .sort({ scheduledDate: 1 })
        .limit(30)
        .populate('note', 'title category')
        .lean(),
      Note.find(baseFilter).sort({ updatedAt: -1 }).limit(30).select('title category').lean(),
      Note.findOne({
        ...baseFilter,
        aiSummary: {
          $exists: true,
          $ne: '',
        },
      })
        .sort({ 'aiData.generatedAt': -1, updatedAt: -1 })
        .select('title aiSummary aiData.generatedAt updatedAt')
        .lean(),
      Reminder.countDocuments({
        user: userId,
        isDone: false,
        scheduledDate: {
          $gte: todayRange.start,
          $lt: todayRange.end,
        },
      }),
    ])

    return res.json({
      stats: {
        totalNotes,
        recentlyEditedCount,
        aiUsageCount,
        publicLinksCount,
        archivedCount,
        todayReminderCount,
      },
      recentlyEditedNotes: recentlyEditedNotes.map((note) => ({
        _id: note._id,
        title: note.title,
        category: note.category,
        tags: note.tags || [],
        updatedAt: note.updatedAt,
        preview: note.plainText || String(note.content || '').replace(/<[^>]*>/g, ' ').trim(),
      })),
      mostUsedTags,
      weeklyActivity,
      calendarNotes: calendarNotes.map((note) => ({
        _id: note._id,
        title: note.title,
        description: note.description || '',
        scheduledDate: note.scheduledDate,
        scheduleText: note.description || '',
        isDone: note.isDone,
        color: note.color,
        noteId: note.note?._id || null,
        note: note.note
          ? {
              _id: note.note._id,
              title: note.note.title,
              category: note.note.category,
            }
          : null,
      })),
      noteOptions: noteOptions.map((note) => ({
        _id: note._id,
        title: note.title,
        category: note.category,
      })),
      latestAiNote: latestAiNote
        ? {
            _id: latestAiNote._id,
            title: latestAiNote.title,
            aiSummary: latestAiNote.aiSummary,
            generatedAt: latestAiNote.aiData?.generatedAt || latestAiNote.updatedAt,
          }
        : null,
    })
  } catch (error) {
    return next(error)
  }
}

async function getDashboardActivity(req, res, next) {
  try {
    const weekOffset = parseWeekOffset(req.query.weekOffset)
    const weeklyActivity = await getWeeklyActivityForUser(req.user._id, weekOffset)

    return res.json({ weeklyActivity })
  } catch (error) {
    return next(error)
  }
}

export { getDashboardActivity, getDashboardInsights }
