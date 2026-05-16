import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import sharedRoutes from './routes/sharedRoutes.js'


const app = express()
const port = process.env.PORT || 5000
const clientOrigins = (
  process.env.CLIENT_URL ||
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pebloNotes API',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api', (_req, res) => {
  res.json({
    name: 'pebloNotes API',
    version: '1.0.0',
    message: 'Backend is ready for collaborative note management features.',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/shared', sharedRoutes)

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({
    message: err.message || 'Internal server error',
  })
})

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`pebloNotes API running on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error(`Failed to start server: ${error.message}`)
    process.exit(1)
  })
