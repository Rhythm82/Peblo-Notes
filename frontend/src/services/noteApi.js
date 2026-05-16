import api from './api'

export async function getNotes(params = {}) {
  const { data } = await api.get('/notes', { params })
  return data
}

export async function getCategories() {
  const { data } = await api.get('/notes/categories')
  return data
}

export async function getNote(id) {
  const { data } = await api.get(`/notes/${id}`)
  return data
}

export async function createNote(payload) {
  const { data } = await api.post('/notes', payload)
  return data
}

export async function updateNote(id, payload) {
  const { data } = await api.patch(`/notes/${id}`, payload)
  return data
}

export async function archiveNote(id) {
  const { data } = await api.patch(`/notes/${id}/archive`)
  return data
}

export async function generateAiSummary(id) {
  const { data } = await api.post(`/notes/${id}/generate-summary`)
  return data
}

export async function generateShareLink(id) {
  const { data } = await api.post(`/notes/${id}/share`)
  return data
}

export async function disableShareLink(id) {
  const { data } = await api.patch(`/notes/${id}/share/disable`)
  return data
}

export async function getShareStatus(id) {
  const { data } = await api.get(`/notes/${id}/share/status`)
  return data
}

export async function deleteNote(id) {
  const { data } = await api.delete(`/notes/${id}`)
  return data
}
