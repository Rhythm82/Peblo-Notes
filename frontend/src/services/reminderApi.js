import api from './api'

export async function getMonthReminders(month) {
  const { data } = await api.get('/reminders', {
    params: { month },
  })
  return data
}

export async function getTodayReminders() {
  const { data } = await api.get('/reminders/today')
  return data
}

export async function createReminder(payload) {
  const { data } = await api.post('/reminders', payload)
  return data
}

export async function updateReminder(id, payload) {
  const { data } = await api.patch(`/reminders/${id}`, payload)
  return data
}

export async function toggleReminderDone(id) {
  const { data } = await api.patch(`/reminders/${id}/done`)
  return data
}

export async function deleteReminder(id) {
  const { data } = await api.delete(`/reminders/${id}`)
  return data
}
