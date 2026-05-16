import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-cyan-50 text-cyan-700 dark:bg-slate-950 dark:text-cyan-200">
        <LoaderCircle className="animate-spin" size={28} />
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
