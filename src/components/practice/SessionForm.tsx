import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import { playerService } from '@/services/player.service'
import { drillService } from '@/services/drill.service'
import type { Player, Drill, CreatePracticeSessionInput } from '@/types/database.types'

interface SessionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SessionForm({ onSuccess, onCancel }: SessionFormProps) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [drills, setDrills] = useState<Drill[]>([])
  const [selectedDrills, setSelectedDrills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreatePracticeSessionInput>({
    player_id: '',
    title: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 60,
    location: '',
    notes: '',
  })

  useEffect(() => {
    if (user?.id) {
      loadPlayers()
      loadDrills()
    }
  }, [user])

  const loadPlayers = async () => {
    if (!user?.id) return
    const { data } = await playerService.getPlayersByCoach(user.id)
    if (data) setPlayers(data)
  }

  const loadDrills = async () => {
    const { data } = await drillService.getAllDrills()
    if (data) setDrills(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setLoading(true)
    try {
      // Create session
      const { data: session, error } = await practiceService.createSession(user.id, formData)
      
      if (error || !session) {
        alert('Error creating session')
        return
      }

      // Add selected drills to session
      for (let i = 0; i < selectedDrills.length; i++) {
        await practiceService.addDrillToSession({
          session_id: session.id,
          drill_id: selectedDrills[i],
          order_index: i,
          sets: 1,
          reps: 1,
        })
      }

      alert('Practice session created successfully!')
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Error creating session')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) : value,
    }))
  }

  const toggleDrill = (drillId: string) => {
    setSelectedDrills((prev) =>
      prev.includes(drillId) ? prev.filter((id) => id !== drillId) : [...prev, drillId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Schedule Practice Session</h2>
      </div>

      {/* Player Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Player <span className="text-red-500">*</span>
        </label>
        <select
          name="player_id"
          value={formData.player_id}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a player</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Shooting Practice"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Session objectives and focus areas..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            required
            min="15"
            step="15"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Main Ice Rink"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Drill Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Drills ({selectedDrills.length} selected)
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          {drills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No drills available</p>
          ) : (
            <div className="space-y-2">
              {drills.map((drill) => (
                <label
                  key={drill.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDrills.includes(drill.id)}
                    onChange={() => toggleDrill(drill.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{drill.title}</p>
                    <p className="text-xs text-gray-500">
                      {drill.category} • {drill.difficulty} • {drill.duration_minutes}min
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Coach Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Additional notes or instructions..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
