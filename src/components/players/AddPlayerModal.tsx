import { useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface AddPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddPlayerModal({ isOpen, onClose, onSuccess }: AddPlayerModalProps) {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPosition('')
    setJerseyNumber('')
    setError('')
    setSuccess(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userProfile?.id) return
    if (!firstName.trim() || !email.trim()) {
      setError('First name and email are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()

      // Add player directly to coach_players table as manually added (no invitation needed)
      const { error: insertError } = await supabase
        .from('coach_players')
        .insert({
          coach_id: userProfile.id,
          player_id: null,
          player_email: email.trim().toLowerCase(),
          player_name: displayName,
          player_position: position.trim() || null,
          jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
          invitation_token: null,
          status: 'manually_added',
          invited_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        // Try without optional fields if schema doesn't have them
        const { error: fallbackError } = await supabase
          .from('coach_players')
          .insert({
            coach_id: userProfile.id,
            player_id: null,
            player_email: email.trim().toLowerCase(),
            invitation_token: null,
            status: 'pending',
            invited_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (fallbackError) {
          setError(fallbackError.message)
          setLoading(false)
          return
        }
      }

      setSuccess(true)
      setTimeout(() => {
        resetForm()
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to add player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Player Manually">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            ✅ Player added successfully!
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Sam"
            required
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
          />
        </div>

        <Input
          label="Email Address *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="player@email.com"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., Center, Defense"
          />
          <Input
            label="Jersey #"
            type="number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="22"
            min="1"
            max="99"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || success}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4" />
                Add Player
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
