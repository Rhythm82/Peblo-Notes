import { GoogleGenAI, Type } from '@google/genai'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const MAX_NOTE_CHARS = 6000

function stripHtml(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanJsonResponse(rawResponse = '') {
  return String(rawResponse)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function buildPrompt(note, noteText) {
  const tags = Array.isArray(note.tags) ? note.tags.join(', ') : ''

  return `
Create a study-friendly summary from this note.

Rules:
- Return JSON only.
- Use simple beginner-friendly English.
- Do not add outside information.
- Keep every section short and useful.
- If code exists, explain it simply.

Note:
Title: ${note.title || 'Untitled'}
Category: ${note.category || 'General'}
Tags: ${tags || 'None'}

Content:
${noteText || 'No note content was provided.'}
`.trim()
}

function normalizeAiData(parsed) {
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    detailed_summary: Array.isArray(parsed.detailed_summary) ? parsed.detailed_summary : [],
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
    suggested_title:
      typeof parsed.suggested_title === 'string' ? parsed.suggested_title.trim() : '',
    difficulty:
      typeof parsed.difficulty === 'string' ? parsed.difficulty.trim() : 'Beginner',
    quick_revision:
      typeof parsed.quick_revision === 'string' ? parsed.quick_revision.trim() : '',
  }
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
    },
    detailed_summary: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    key_points: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    action_items: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    suggested_title: {
      type: Type.STRING,
    },
    difficulty: {
      type: Type.STRING,
    },
    quick_revision: {
      type: Type.STRING,
    },
  },
  required: [
    'summary',
    'detailed_summary',
    'key_points',
    'action_items',
    'suggested_title',
    'difficulty',
    'quick_revision',
  ],
}

export async function generateNoteSummary(note) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env and restart backend.')
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  const noteText = (note.plainText?.trim() || stripHtml(note.content || '')).slice(
    0,
    MAX_NOTE_CHARS,
  )

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(note, noteText),
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  })

  const rawText = response.text || ''

  if (!rawText.trim()) {
    console.error('Gemini empty response:', response)
    throw new Error('Gemini returned an empty response.')
  }

  const cleanedText = cleanJsonResponse(rawText)

  try {
    const parsed = JSON.parse(cleanedText)
    return normalizeAiData(parsed)
  } catch (error) {
    console.error('Gemini returned invalid JSON raw response:', rawText)
    console.error('Cleaned JSON text:', cleanedText)

    throw new Error('Gemini response could not be parsed as JSON.')
  }
}