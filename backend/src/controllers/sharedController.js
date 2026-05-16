import Note from '../models/Note.js'

function buildPublicNote(note) {
  const showAiSummary = note.shareSettings?.showAiSummary !== false

  return {
    title: note.title,
    content: note.content,
    plainText: note.plainText,
    category: note.category,
    tags: note.tags,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
    shareSettings: {
      showAiSummary,
      allowPdfDownload: note.shareSettings?.allowPdfDownload !== false,
    },
    ...(showAiSummary
      ? {
          aiSummary: note.aiSummary,
          aiActionItems: note.aiActionItems,
          aiSuggestedTitle: note.aiSuggestedTitle,
          aiData: note.aiData,
        }
      : {}),
  }
}

async function getSharedNote(req, res, next) {
  try {
    const shareId = String(req.params.shareId || '').trim()

    if (!/^[a-f0-9]{24}$/i.test(shareId)) {
      return res.status(404).json({
        message: 'This shared note link is invalid.',
      })
    }

    const note = await Note.findOne({
      shareId,
      isDeleted: false,
    })

    if (!note) {
      return res.status(404).json({
        message: 'This shared note link is invalid.',
      })
    }

    if (!note.isPublic) {
      return res.status(410).json({
        message: 'This shared note link has expired or is no longer public.',
      })
    }

    note.shareViews = (note.shareViews || 0) + 1
    note.lastSharedViewedAt = new Date()
    await note.save()

    return res.json({
      note: buildPublicNote(note),
    })
  } catch (error) {
    return next(error)
  }
}

export { getSharedNote }
