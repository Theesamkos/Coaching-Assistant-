import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { CoachPlayer } from '@/types'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { supabaseUser, userProfile, isAuthenticated, isPlayer } = useAuth()
  
  const [invitation, setInvitation] = useState<CoachPlayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [token, isAuthenticated])

  async function loadInvitation() {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: inviteError } = await playerService.getInvitationByToken(token)
    
    if (inviteError || !data) {
      setError(inviteError?.message || 'Invalid or expired invitation')
      setLoading(false)
      return
    }

    // Check if invitation is expired
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      setError('This invitation has expired')
      setLoading(false)
      return
    }

    // Check if already accepted
    if (data.status === 'accepted') {
      setError('This invitation has already been accepted')
      setLoading(false)
      return
    }

    setInvitation(data)
    setLoading(false)

    // If user is logged in and is a player, auto-attempt to accept
    if (isAuthenticated && isPlayer && userProfile) {
      // Check if the email matches
      if (userProfile.email === data.playerEmail) {
        handleAcceptInvitation()
      } else {
        setError(`This invitation is for ${data.playerEmail}, but you're logged in as ${userProfile.email}. Please log out and sign in with the correct account.`)
      }
    }
  }

  async function handleAcceptInvitation() {
    if (!invitation || !userProfile?.id) return

    setAccepting(true)
    setError('')

    const { data, error: acceptError } = await playerService.acceptInvitation(
      invitation.invitationToken!,
      userProfile.id
    )

    if (acceptError || !data) {
      setError(acceptError?.message || 'Failed to accept invitation')
      setAccepting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      navigate('/dashboard')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h2>
            <p className="text-slate-300 mb-6">You've been added to your coach's roster. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // User needs to log in or register
  if (!isAuthenticated || !isPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Team Invitation</h2>
            {invitation?.coach && (
              <p className="text-slate-300 mb-4">
                <span className="text-emerald-400 font-semibold">{invitation.coach.displayName}</span> has invited you to join their team!
              </p>
            )}
            <p className="text-slate-400 text-sm">
              Sign in or create an account to accept this invitation
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to={`/login?redirect=/invite/${token}`}
              className="block w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-lg transition-colors font-semibold"
            >
              Sign In to Accept
            </Link>
            <Link
              to={`/register?email=${encodeURIComponent(invitation?.playerEmail || '')}&redirect=/invite/${token}`}
              className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-center rounded-lg transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account with a different email?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // User is logged in as a player - manual accept button
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Invitation</h2>
          {invitation?.coach && (
            <p className="text-slate-300 mb-6">
              <span className="text-emerald-400 font-semibold">{invitation.coach.displayName}</span> has invited you to join their team!
            </p>
          )}

          <button
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <Link
            to="/dashboard"
            className="block mt-3 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}

