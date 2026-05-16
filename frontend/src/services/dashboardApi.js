import api from './api'

export async function getDashboardInsights(weekOffset = 0) {
  const { data } = await api.get('/dashboard/insights', {
    params: { weekOffset },
  })
  return data
}

export async function getWeeklyActivity(weekOffset = 0) {
  const { data } = await api.get('/dashboard/activity', {
    params: { weekOffset },
  })
  return data
}
