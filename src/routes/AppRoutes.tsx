import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProfileSetupPage from '@/pages/auth/ProfileSetupPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage'
import CoachDashboard from '@/pages/coach/CoachDashboard'
import PlayerDashboard from '@/pages/player/PlayerDashboard'
import PlayersListPage from '@/pages/coach/PlayersListPage'
import PlayerDetailPage from '@/pages/coach/PlayerDetailPage'
import InvitePlayerPage from '@/pages/coach/InvitePlayerPage'
import PracticesPage from '@/pages/coach/PracticesPage'
import CreatePracticePage from '@/pages/coach/CreatePracticePage'
import EditPracticePage from '@/pages/coach/EditPracticePage'
import PracticeDetailPage from '@/pages/coach/PracticeDetailPage'
import ProgressTrackingPage from '@/pages/coach/ProgressTrackingPage'
import PlayerProgressPage from '@/pages/coach/PlayerProgressPage'
import TeamAnalyticsPage from '@/pages/coach/TeamAnalyticsPage'
import DrillLibrary from '@/pages/drills/DrillLibrary'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ServicesTestPage from '@/pages/test/ServicesTestPage'

function AppRoutes() {
  const { loading, isAuthenticated, needsProfileSetup, userProfile } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner />
      </div>
    )
  }

  // Determine dashboard based on user role
  const DashboardComponent = userProfile?.role === 'coach' ? CoachDashboard : PlayerDashboard

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
      />
      
      {/* Invitation acceptance page - accessible to both logged in and logged out users */}
      <Route
        path="/invite/:token"
        element={<AcceptInvitePage />}
      />

      {/* Protected routes */}
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            {needsProfileSetup ? <ProfileSetupPage /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {needsProfileSetup ? (
              <Navigate to="/profile-setup" replace />
            ) : (
              <DashboardComponent />
            )}
          </ProtectedRoute>
        }
      />

      {/* Coach Routes */}
      <Route
        path="/coach/players"
        element={
          <ProtectedRoute requiredRole="coach">
            <PlayersListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/players/invite"
        element={
          <ProtectedRoute requiredRole="coach">
            <InvitePlayerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/players/:id"
        element={
          <ProtectedRoute requiredRole="coach">
            <PlayerDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/practices"
        element={
          <ProtectedRoute requiredRole="coach">
            <PracticesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/practices/create"
        element={
          <ProtectedRoute requiredRole="coach">
            <CreatePracticePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/practices/:id/edit"
        element={
          <ProtectedRoute requiredRole="coach">
            <EditPracticePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/practices/:id"
        element={
          <ProtectedRoute requiredRole="coach">
            <PracticeDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/progress"
        element={
          <ProtectedRoute requiredRole="coach">
            <ProgressTrackingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/progress/:id"
        element={
          <ProtectedRoute requiredRole="coach">
            <PlayerProgressPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/analytics"
        element={
          <ProtectedRoute requiredRole="coach">
            <TeamAnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Placeholder routes for features we'll build */}
      <Route
        path="/players"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Players</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coaches"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">My Coaches</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/drills"
        element={
          <ProtectedRoute>
            <DrillLibrary />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/coach/drills"
        element={
          <ProtectedRoute requiredRole="coach">
            <DrillLibrary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/practices"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Practices</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Practice Plans</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Library</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/files"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Files</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">AI Assistant</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Progress Tracking</h1>
                <p className="text-slate-600">Coming soon...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            needsProfileSetup ? (
              <Navigate to="/profile-setup" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Internal Test Route (REMOVE IN PRODUCTION) */}
      <Route
        path="/test/services"
        element={
          <ProtectedRoute>
            <ServicesTestPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
              <p className="text-slate-600 mb-4">Page not found</p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
                Go to Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default AppRoutes
