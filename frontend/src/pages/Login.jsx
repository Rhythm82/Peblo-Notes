import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function getError(error) {
  return error.response?.data?.message || 'Login failed. Please try again.'
}

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-[radial-gradient(circle_at_top,#c4b5fd,transparent_34%),linear-gradient(135deg,#f8fafc,#ecfeff,#eef2ff)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,#3730a3,transparent_34%),linear-gradient(135deg,#020617,#0f172a,#172554)]">
      <section className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-600 text-white">
          <LockKeyhole size={26} />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-normal text-slate-950 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-200">
          New to pebloNotes?{' '}
          <Link className="font-bold text-cyan-700 dark:text-cyan-200" to="/signup">
            Create an account
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email</span>
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Password</span>
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Example@123"
              required
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 text-sm font-black text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
