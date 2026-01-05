import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/user.service'
import { UserRole } from '@/types'

export default function ProfileSetupPage() {
  const { supabaseUser, userProfile, setUserProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('player')
  const [organization, setOrganization] = useState('')
  const [position, setPosition] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (supabaseUser) {
      setDisplayName(supabaseUser.user_metadata?.display_name || supabaseUser.email || '')
    }
    if (userProfile) {
      setRole(userProfile.role)
      if (userProfile.role === 'coach') {
        setOrganization((userProfile as any).organization || '')
      } else {
        setPosition((userProfile as any).position || '')
      }
    }
  }, [supabaseUser, userProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabaseUser) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const additionalData =
      role === 'coach' ? { organization } : { position }

    const { success, error: updateError } = await userService.createUserProfile(
      supabaseUser.id,
      {
        email: supabaseUser.email || '',
        displayName,
        photoURL: supabaseUser.user_metadata?.avatar_url || undefined,
        role,
        ...additionalData,
      }
    )

    if (updateError || !success) {
      setError(updateError?.message || 'Failed to save profile')
      setLoading(false)
    } else {
      // Reload user profile
      const { user } = await userService.getUserProfile(supabaseUser.id)
      if (user) {
        setUserProfile(user)
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's set up your profile to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="display-name"
                name="displayName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="coach"
                    checked={role === 'coach'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mr-2"
                  />
                  Coach
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="player"
                    checked={role === 'player'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mr-2"
                  />
                  Player
                </label>
              </div>
            </div>

            {role === 'coach' && (
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization (optional)
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Team or organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            )}

            {role === 'player' && (
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position (optional)
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="e.g., Forward, Defense, Goalie"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



