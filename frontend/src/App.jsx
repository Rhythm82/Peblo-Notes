import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NoteEditor from "./pages/NoteEditor";
import NoteReader from "./pages/NoteReader";
import Notes from "./pages/Notes";
import SharedNote from "./pages/SharedNote";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";

function App() {
  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#bae6fd,transparent_28%),radial-gradient(circle_at_90%_12%,#ddd6fe,transparent_24%),linear-gradient(135deg,#f8fafc,#ecfeff,#f5f3ff)] text-slate-950 dark:bg-[radial-gradient(circle_at_12%_8%,#155e75,transparent_28%),radial-gradient(circle_at_90%_12%,#4c1d95,transparent_24%),linear-gradient(135deg,#020617,#0f172a,#111827)] dark:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shared/:shareId" element={<SharedNote />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/new"
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <NoteReader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id/edit"
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
