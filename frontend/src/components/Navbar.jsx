import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpenText, LogOut, Menu, UserRound, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import logo from "../../public/logo.jpg";

function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setIsMenuOpen(false);
    navigate("/login");
  }

  function navClass({ isActive }) {
    return `relative rounded-full px-5 py-2.5 text-sm font-black transition-all duration-300 ${
      isActive
        ? "bg-white/40 text-cyan-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(34,211,238,0.16)] ring-1 ring-white/50 dark:bg-cyan-100/15 dark:text-cyan-100 dark:ring-cyan-100/20"
        : "text-slate-700 hover:bg-white/25 hover:text-cyan-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-cyan-100"
    }`;
  }

  function mobileNavClass({ isActive }) {
    return `rounded-2xl px-4 py-3 transition ${
      isActive
        ? "bg-white/35 text-cyan-900 dark:bg-cyan-100/10 dark:text-cyan-100"
        : "hover:bg-white/25 dark:hover:bg-white/10"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/10 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/10 dark:shadow-[0_10px_45px_rgba(0,0,0,0.22)]">
      <nav className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="group flex items-center gap-3 text-lg font-black text-slate-950 drop-shadow-sm dark:text-white"
        >
          <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-cyan-100/40 bg-white/45 shadow-lg shadow-cyan-500/20 backdrop-blur-2xl dark:border-cyan-100/15 dark:bg-white/10">
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />

            <img
              src={logo}
              alt="PebloNotes logo"
              className="relative z-10 h-9 w-9 rounded-xl object-cover"
            />
          </span>

          <span className="hidden sm:inline">PebloNotes</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-white/25 bg-white/15 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] md:flex">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>

          {user && (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>

              <NavLink to="/notes" className={navClass}>
                Notes
              </NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 text-sm font-black text-slate-800 shadow-lg shadow-cyan-900/10 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/40 hover:text-cyan-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:inline-flex"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden h-10 items-center justify-center gap-2 rounded-full border border-transparent px-3 text-sm font-black text-slate-700 backdrop-blur-2xl transition hover:border-white/35 hover:bg-white/20 hover:text-cyan-700 dark:text-slate-200 dark:hover:border-white/10 dark:hover:text-cyan-200 sm:inline-flex"
              >
                <UserRound size={16} />
                Login
              </Link>

              <Link
                to="/signup"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/25 px-4 text-sm font-black text-slate-800 shadow-lg shadow-cyan-900/10 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/40 hover:text-cyan-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <BookOpenText size={16} />
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/20 text-slate-700 shadow-lg shadow-cyan-900/10 backdrop-blur-2xl transition hover:bg-white/35 md:hidden dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            aria-label="Menu"
            title="Menu"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="w-full border-t border-white/10 bg-white/10 px-4 pb-4 pt-2 backdrop-blur-2xl dark:bg-slate-950/10 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 rounded-[1.5rem] border border-white/25 bg-white/20 p-3 text-sm font-black text-slate-700 shadow-xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200">
            <NavLink
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={mobileNavClass}
            >
              Home
            </NavLink>

            {user && (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={mobileNavClass}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/notes"
                  onClick={() => setIsMenuOpen(false)}
                  className={mobileNavClass}
                >
                  Notes
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-left transition hover:bg-white/25 dark:hover:bg-white/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 transition hover:bg-white/25 dark:hover:bg-white/10"
                >
                  <UserRound size={16} />
                  Login
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-2xl bg-white/30 px-4 py-3 text-cyan-900 transition hover:bg-white/45 dark:bg-cyan-100/10 dark:text-cyan-100 dark:hover:bg-cyan-100/15"
                >
                  <BookOpenText size={16} />
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
