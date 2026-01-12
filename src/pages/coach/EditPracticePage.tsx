import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import { drillService } from '@/services/drill.service'
import { playerManagementService } from '@/services/player-management.service'
import { teamService } from '@/services/team.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import { Drill, EnhancedPlayer, Team, PracticeStatus, PracticeWithDetails } from '@/types'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function EditPracticePage() {
  const { id } = useParams<{ id: string }>()
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  // Practice data
  const [practice, setPractice] = useState<PracticeWithDetails | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<PracticeStatus>('scheduled')

  // Drill selection
  const [availableDrills, setAvailableDrills] = useState<Drill[]>([])
  const [selectedDrills, setSelectedDrills] = useState<string[]>([])
  const [showDrillSelector, setShowDrillSelector] = useState(false)
  const [drillSearchTerm, setDrillSearchTerm] = useState('')

  // Player selection
  const [availablePlayers, setAvailablePlayers] = useState<EnhancedPlayer[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [playerAssignmentMode, setPlayerAssignmentMode] = useState<'individual' | 'team' | 'all'>(
    'individual'
  )

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (id && userProfile?.id) {
      loadInitialData()
    }
  }, [id, userProfile])

  const loadInitialData = async () => {
    if (!id || !userProfile?.id) return

    setLoadingData(true)
    try {
      // Load practice
      const { data: practiceData, error: practiceError } =
        await practiceService.getPracticeWithDetails(id)
      
      if (practiceError || !practiceData) {
        setError('Practice not found')
        setLoadingData(false)
        return
      }

      setPractice(practiceData)

      // Populate form
      setTitle(practiceData.title)
      setDescription(practiceData.description || '')
      setScheduledDate(format(new Date(practiceData.scheduledDate), 'yyyy-MM-dd'))
      setScheduledTime(format(new Date(practiceData.scheduledDate), 'HH:mm'))
      setDurationMinutes(practiceData.durationMinutes?.toString() || '')
      setLocation(practiceData.location || '')
      setNotes(practiceData.notes || '')
      setStatus(practiceData.status)

      // Set selected drills
      if (practiceData.drills) {
        setSelectedDrills(practiceData.drills.map((d) => d.drillId))
      }

      // Set selected players
      if (practiceData.players) {
        setSelectedPlayers(practiceData.players.map((p) => p.playerId))
      }

      // Load drills
      const { data: drills } = await drillService.getDrills(userProfile.id)
      setAvailableDrills(drills || [])

      // Load players
      const { data: players } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )
      setAvailablePlayers(players || [])

      // Load teams
      const { data: teams } = await teamService.getCoachTeams(userProfile.id)
      setAvailableTeams(teams || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load practice data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title || !scheduledDate || !scheduledTime) {
      setError('Please fill in all required fields')
      return
    }

    if (!id) {
      setError('Practice ID not found')
      return
    }

    // Combine date and time
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`)

    setLoading(true)
    try {
      // Update practice
      const { error: updateError } = await practiceService.updatePractice(id, {
        title,
        description: description || undefined,
        scheduledDate: dateTime,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        location: location || undefined,
        notes: notes || undefined,
        status,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to update practice')
        return
      }

      // Update drills - remove all existing and add new ones
      if (practice?.drills) {
        for (const practiceDrill of practice.drills) {
          await practiceService.removeDrillFromPractice(id, practiceDrill.drillId)
        }
      }

      if (selectedDrills.length > 0) {
        for (let i = 0; i < selectedDrills.length; i++) {
          await practiceService.addDrillToPractice(id, selectedDrills[i], i)
        }
      }

      // Update players - remove all existing and add new ones
      if (practice?.players) {
        for (const practicePlayer of practice.players) {
          await practiceService.removePlayerFromPractice(id, practicePlayer.playerId)
        }
      }

      let playerIds: string[] = []

      if (playerAssignmentMode === 'all') {
        playerIds = availablePlayers.map((p) => p.id)
      } else if (playerAssignmentMode === 'individual') {
        playerIds = selectedPlayers
      } else if (playerAssignmentMode === 'team') {
        for (const teamId of selectedTeams) {
          const { data: teamPlayers } = await teamService.getTeamPlayers(teamId)
          if (teamPlayers) {
            playerIds.push(...teamPlayers.map((p) => p.id))
          }
        }
        playerIds = [...new Set(playerIds)]
      }

      if (playerIds.length > 0) {
        await practiceService.assignPlayersToPractice(id, playerIds)
      }

      // Navigate back to practice detail
      navigate(`/coach/practices/${id}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleDrill = (drillId: string) => {
    setSelectedDrills((prev) =>
      prev.includes(drillId) ? prev.filter((id) => id !== drillId) : [...prev, drillId]
    )
  }

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  const filteredDrills = availableDrills.filter((drill) =>
    drill.title.toLowerCase().includes(drillSearchTerm.toLowerCase())
  )

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

  if (loadingData) {
    return (
      <DashboardLayout
        user={supabaseUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        role="coach"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading practice...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!practice) {
    return (
      <DashboardLayout
        user={supabaseUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        role="coach"
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Practice Not Found</h2>
          <Button onClick={() => navigate('/coach/practices')}>Back to Practices</Button>
        </div>
      </DashboardLayout>
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
          onClick={() => navigate(`/coach/practices/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Practice
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Edit Practice</h1>
        <p className="text-slate-400">Update practice details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Practice Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Skating Drills"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the practice..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date *
                  <CalendarIcon className="inline h-4 w-4 ml-2" />
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Time *
                  <ClockIcon className="inline h-4 w-4 ml-2" />
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                  min="1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                  <MapPinIcon className="inline h-4 w-4 ml-2" />
                </label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Main Rink"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PracticeStatus)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Coach Notes</label>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for preparation..."
                rows={3}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Drills Section - Same as Create */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Drills ({selectedDrills.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowDrillSelector(!showDrillSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              {showDrillSelector ? 'Close' : 'Add Drills'}
            </button>
          </div>

          {selectedDrills.length > 0 && (
            <div className="mb-4 space-y-2">
              {selectedDrills.map((drillId, index) => {
                const drill = availableDrills.find((d) => d.id === drillId)
                if (!drill) return null
                return (
                  <div
                    key={drillId}
                    className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">#{index + 1}</span>
                      <span className="text-white font-medium">{drill.title}</span>
                      {drill.durationMinutes && (
                        <span className="text-sm text-slate-400">{drill.durationMinutes} min</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDrill(drillId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {showDrillSelector && (
            <div className="space-y-3">
              <Input
                type="text"
                value={drillSearchTerm}
                onChange={(e) => setDrillSearchTerm(e.target.value)}
                placeholder="Search drills..."
                className="w-full"
              />

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredDrills.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No drills found</p>
                ) : (
                  filteredDrills.map((drill) => (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => toggleDrill(drill.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDrills.includes(drill.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{drill.title}</div>
                          {drill.category && (
                            <div className="text-sm opacity-75">{drill.category}</div>
                          )}
                        </div>
                        {selectedDrills.includes(drill.id) && (
                          <CheckIcon className="h-5 w-5" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Assignment Section - Same as Create */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Player Assignment</h2>

          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={() => setPlayerAssignmentMode('all')}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                playerAssignmentMode === 'all'
                  ? 'bg-blue-600 text-white border-2 border-blue-500'
                  : 'bg-slate-700 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-medium mb-1">All Players</div>
              <div className="text-sm opacity-75">
                Assign all players ({availablePlayers.length})
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPlayerAssignmentMode('team')}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                playerAssignmentMode === 'team'
                  ? 'bg-blue-600 text-white border-2 border-blue-500'
                  : 'bg-slate-700 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-medium mb-1">By Team</div>
              <div className="text-sm opacity-75">Select specific teams</div>
            </button>

            <button
              type="button"
              onClick={() => setPlayerAssignmentMode('individual')}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                playerAssignmentMode === 'individual'
                  ? 'bg-blue-600 text-white border-2 border-blue-500'
                  : 'bg-slate-700 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-medium mb-1">Individual Players</div>
              <div className="text-sm opacity-75">Select specific players</div>
            </button>
          </div>

          {playerAssignmentMode === 'team' && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 mb-2">
                Select teams ({selectedTeams.length} selected)
              </p>
              {availableTeams.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No teams available</p>
              ) : (
                availableTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeam(team.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTeams.includes(team.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{team.name}</div>
                        {team.season && <div className="text-sm opacity-75">{team.season}</div>}
                      </div>
                      {selectedTeams.includes(team.id) && <CheckIcon className="h-5 w-5" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {playerAssignmentMode === 'individual' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-400 mb-2">
                Select players ({selectedPlayers.length} selected)
              </p>
              {availablePlayers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No players available</p>
              ) : (
                availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPlayers.includes(player.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{player.displayName}</div>
                        {player.position && (
                          <div className="text-sm opacity-75">{player.position}</div>
                        )}
                      </div>
                      {selectedPlayers.includes(player.id) && <CheckIcon className="h-5 w-5" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/coach/practices/${id}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
