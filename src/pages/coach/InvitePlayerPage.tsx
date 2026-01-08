import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { CoachPlayer } from '@/types'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function InvitePlayerPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // Pending invitations
  const [pendingInvitations, setPendingInvitations] = useState<CoachPlayer[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)

  useEffect(() => {
    if (userProfile?.id) {
      loadPendingInvitations()
    }
  }, [userProfile])

  const loadPendingInvitations = async () => {
    if (!userProfile?.id) return

    setLoadingInvitations(true)
    const { data, error } = await playerService.getCoachPlayers(userProfile.id)

    if (!error && data) {
      // Filter for pending invitations only
      setPendingInvitations(data.filter((cp) => cp.status === 'pending'))
    }
    setLoadingInvitations(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setGeneratedLink('')

    if (!email) {
      setError('Please enter an email address')
      return
    }

    if (!userProfile?.id || !userProfile?.email) {
      setError('User profile not loaded')
      return
    }

    setLoading(true)

    try {
      const { data, error: inviteError } = await playerService.invitePlayer(
        userProfile.id,
        email
      )

      if (inviteError || !data) {
        setError(inviteError?.message || 'Failed to send invitation')
      } else {
        setSuccess(true)
        // Generate the invitation link
        const inviteLink = `${window.location.origin}/invite/${data.invitationToken}`
        setGeneratedLink(inviteLink)
        
        // Reset form
        setEmail('')
        setMessage('')
        
        // Reload invitations
        loadPendingInvitations()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!userProfile?.id) return
    
    const confirmed = window.confirm('Are you sure you want to cancel this invitation?')
    if (!confirmed) return

    const { error } = await playerService.cancelInvitation(invitationId, userProfile.id)
    
    if (error) {
      alert('Failed to cancel invitation')
    } else {
      loadPendingInvitations()
    }
  }

  const handleLogout = async () => {
    navigate('/login')
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Access denied. Coaches only.</div>
      </div>
    )
  }

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="coach"
    >
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/coach/players')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Players
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Invite Player</h1>
        <p className="text-slate-400">
          Send an invitation link to a player to join your roster
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invitation Form */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Send Invitation</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Player Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Optional Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal note to the invitation..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                This message will be included in the invitation email (when email service is enabled)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message with Link */}
            {success && generatedLink && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckIcon className="h-5 w-5" />
                  <p className="font-medium">Invitation Created!</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-300 mb-2">Share this link with the player:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-5 w-5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  💡 The player will use this link to create their account and join your roster.
                  The link expires in 30 days.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                loading
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creating Invitation...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Generate Invitation Link
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-300">
                  <li>Enter the player's email address</li>
                  <li>Click "Generate Invitation Link"</li>
                  <li>Copy and share the link with the player</li>
                  <li>Player clicks the link and creates their account</li>
                  <li>They'll automatically be added to your roster!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Pending Invitations ({pendingInvitations.length})
          </h2>

          {loadingInvitations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p className="text-slate-400">Loading invitations...</p>
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No pending invitations</p>
              <p className="text-sm text-slate-500 mt-1">
                Invitations will appear here once you send them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={() => handleCancelInvitation(invitation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Invitation Card Component
interface InvitationCardProps {
  invitation: CoachPlayer
  onCancel: () => void
}

function InvitationCard({ invitation, onCancel }: InvitationCardProps) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/invite/${invitation.invitationToken}`

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const daysAgo = Math.floor(
    (Date.now() - new Date(invitation.invitedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-medium">
            {invitation.playerEmail || invitation.player?.email || 'Email not available'}
          </p>
          <p className="text-sm text-slate-400">
            Sent {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
          </p>
        </div>
        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
          Pending
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-sm transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copy Link
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors flex items-center gap-2"
        >
          <XMarkIcon className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}

