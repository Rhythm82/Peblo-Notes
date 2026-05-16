import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function getError(error) {
  return error.response?.data?.message || 'Could not verify OTP. Please try again.'
}

function VerifyOtp() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOtp } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp({ email, otp })
      navigate('/dashboard')
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-[radial-gradient(circle_at_top,#a7f3d0,transparent_34%),linear-gradient(135deg,#f8fafc,#ecfeff,#eef2ff)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,#0f766e,transparent_34%),linear-gradient(135deg,#020617,#0f172a,#172554)]">
      <section className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500 text-white">
          <ShieldCheck size={26} />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-normal text-slate-950 dark:text-white">
          Verify your email
        </h1>
        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-200">
          Enter the 6-digit OTP sent to your inbox. It expires in about 10 minutes.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email</span>
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">OTP</span>
            <input
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-center text-2xl font-black tracking-[0.35em] text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
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
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <KeyRound size={17} />
            {loading ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          Need a new code?{' '}
          <Link className="font-bold text-cyan-700 dark:text-cyan-200" to="/signup">
            Sign up again
          </Link>
        </p>
      </section>
    </main>
  )
}

export default VerifyOtp
