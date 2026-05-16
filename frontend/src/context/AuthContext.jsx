/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      setUser(null)
      localStorage.removeItem('peblonotes_token')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload)
    return data
  }

  async function verifyOtp(payload) {
    const { data } = await api.post('/auth/verify-otp', payload)
    if (data.token) localStorage.setItem('peblonotes_token', data.token)
    setUser(data.user)
    return data
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload)
    if (data.token) localStorage.setItem('peblonotes_token', data.token)
    setUser(data.user)
    return data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('peblonotes_token')
      setUser(null)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const { data } = await api.get('/auth/me')
        if (isMounted) setUser(data.user)
      } catch {
        localStorage.removeItem('peblonotes_token')
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      loading,
      login,
      logout,
      refreshUser,
      signup,
      user,
      verifyOtp,
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
