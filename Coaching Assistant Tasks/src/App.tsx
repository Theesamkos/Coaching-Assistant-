import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './config/supabase'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CoachDashboard from './pages/coach/CoachDashboard'
import PlayerDashboard from './pages/player/PlayerDashboard'
import DrillLibrary from './pages/drills/DrillLibrary'
import ProgressTracker from './pages/progress/ProgressTracker'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={user ? <CoachDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/player-dashboard"
          element={user ? <PlayerDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/drills"
          element={user ? <DrillLibrary /> : <Navigate to="/login" />}
        />
        <Route
          path="/progress"
          element={user ? <ProgressTracker /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App
