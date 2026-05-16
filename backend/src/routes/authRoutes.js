import express from 'express'
import {
  login,
  logout,
  me,
  signup,
  verifyOtp,
} from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/verify-otp', verifyOtp)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', protect, me)

export default router
