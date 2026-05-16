import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const passwordRules = [
  '8 to 16 characters',
  'At least one number',
  'At least one symbol',
  'At least one letter',
]

function getError(error) {
  return error.response?.data?.message || 'Something went wrong. Please try again.'
}

function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      const data = await signup(form)
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_top,#bae6fd,transparent_35%),linear-gradient(135deg,#f8fafc,#f0fdfa,#eef2ff)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,#155e75,transparent_35%),linear-gradient(135deg,#020617,#0f172a,#172554)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem] border border-white/60 bg-white/45 p-8 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-600 text-white">
              <Mail size={26} />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-normal text-slate-950 dark:text-white">
              Step 1: create your account.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-700 dark:text-slate-200">
              Enter your details and we will email a 6-digit OTP. Your account
              activates only after verification.
            </p>
          </motion.div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <UserRound size={22} />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-normal text-slate-950 dark:text-white">
              Sign up for pebloNotes
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-200">
              Already have an account?{' '}
              <Link className="font-bold text-cyan-700 dark:text-cyan-200" to="/login">
                Login
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Name</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:focus:ring-cyan-950"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="peblo Notes"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:focus:ring-cyan-950"
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
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:focus:ring-cyan-950"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Example@123"
                  required
                />
              </label>

              <div className="grid gap-2 rounded-3xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-100 sm:grid-cols-2">
                {passwordRules.map((rule) => (
                  <span key={rule}>{rule}</span>
                ))}
              </div>

              {error && (
                <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 text-sm font-black text-white shadow-lg shadow-cyan-700/25 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Signup
