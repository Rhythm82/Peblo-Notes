import mongoose from 'mongoose'

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'cyan',
    },
  },
  {
    timestamps: true,
  },
)

reminderSchema.index({ user: 1, scheduledDate: 1 })

export default mongoose.model('Reminder', reminderSchema)
