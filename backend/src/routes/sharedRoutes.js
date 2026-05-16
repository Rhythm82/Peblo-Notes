import express from 'express'
import { getSharedNote } from '../controllers/sharedController.js'

const router = express.Router()

router.get('/:shareId', getSharedNote)

export default router
