import express from 'express'
import {
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
} from '../controllers/noteController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/', getNotes)
router.get('/categories', getCategories)
router.post('/:id/generate-summary', generateAiSummary)
router.post('/:id/share', generatePublicShareLink)
router.patch('/:id/share/disable', disablePublicShareLink)
router.get('/:id/share/status', getPublicShareStatus)
router.get('/:id', getNote)
router.post('/', createNote)
router.patch('/:id', updateNote)
router.patch('/:id/archive', toggleArchive)
router.delete('/:id', deleteNote)

export default router
