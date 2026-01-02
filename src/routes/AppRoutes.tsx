import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProfileSetupPage from '@/pages/auth/ProfileSetupPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function AppRoutes() {
  const { loading, isAuthenticated, needsProfileSetup } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

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
              <div>Dashboard (Coming Soon)</div>
            )}
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
    </Routes>
  )
}

export default AppRoutes

