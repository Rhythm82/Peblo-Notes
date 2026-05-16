import api from './api'

export async function getSharedNote(shareId) {
  const { data } = await api.get(`/shared/${shareId}`)
  return data
}
