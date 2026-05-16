import jwt from 'jsonwebtoken'
import User from '../models/User.js'

async function protect(req, res, next) {
  try {
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null
    const token = req.cookies?.token || bearerToken

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please login.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }

    req.user = user
    return next()
  } catch (_error) {
    return res.status(401).json({ message: 'Session expired. Please login again.' })
  }
}

export default protect