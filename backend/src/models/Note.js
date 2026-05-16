import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    type: String,
    name: String,
    size: Number,
  },
  {
    _id: false,
  },
)

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    content: {
      type: String,
      default: '',
    },
    plainText: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: 80,
    },
    tags: {
      type: [String],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    editorData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    canvasData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    aiSummary: {
      type: String,
      default: '',
    },
    aiActionItems: {
      type: [String],
      default: [],
    },
    aiSuggestedTitle: {
      type: String,
      default: '',
    },
    aiData: {
      detailedSummary: {
        type: [String],
        default: [],
      },
      keyPoints: {
        type: [String],
        default: [],
      },
      difficulty: {
        type: String,
        default: '',
      },
      quickRevision: {
        type: String,
        default: '',
      },
      generatedAt: Date,
    },
    shareId: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareCreatedAt: Date,
    shareDisabledAt: Date,
    shareViews: {
      type: Number,
      default: 0,
    },
    lastSharedViewedAt: Date,
    shareSettings: {
      showAiSummary: {
        type: Boolean,
        default: true,
      },
      allowPdfDownload: {
        type: Boolean,
        default: true,
      },
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    scheduleText: {
      type: String,
      default: '',
    },
    collaborators: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'viewer',
          },
        },
      ],
      default: [],
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

noteSchema.index({ user: 1, isDeleted: 1, isArchived: 1, updatedAt: -1 })
noteSchema.index({ user: 1, category: 1, isDeleted: 1 })
noteSchema.index({ title: 'text', content: 'text', plainText: 'text', tags: 'text' })

export default mongoose.model('Note', noteSchema)
