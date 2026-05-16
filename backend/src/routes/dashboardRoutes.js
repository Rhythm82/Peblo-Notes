import express from 'express'
import {
  getDashboardActivity,
  getDashboardInsights,
} from '../controllers/dashboardController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/insights', getDashboardInsights)
router.get('/activity', getDashboardActivity)

export default router
