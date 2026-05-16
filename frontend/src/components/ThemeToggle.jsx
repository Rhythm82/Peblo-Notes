import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/45 text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default ThemeToggle
