import express from 'express'
import {
  createReminder,
  deleteReminder,
  getMonthReminders,
  getTodayReminders,
  toggleReminderDone,
  updateReminder,
} from '../controllers/reminderController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/', getMonthReminders)
router.get('/today', getTodayReminders)
router.post('/', createReminder)
router.patch('/:id', updateReminder)
router.patch('/:id/done', toggleReminderDone)
router.delete('/:id', deleteReminder)

export default router
