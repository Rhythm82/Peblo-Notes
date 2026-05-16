import crypto from 'crypto'
import Note from '../models/Note.js'

export default async function generateShareId() {
  let shareId = crypto.randomBytes(12).toString('hex')

  while (await Note.findOne({ shareId })) {
    shareId = crypto.randomBytes(12).toString('hex')
  }

  return shareId
}
