import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { practiceService } from '@/services/practice.service'
import { drillService } from '@/services/drill.service'
import type { Player, PracticeSession, Drill } from '@/types/database.types'

export default function CoachDashboard() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<PracticeSession[]>([])
  const [customDrills, setCustomDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalSessions: 0,
    customDrills: 0,
  })

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Load players
      const { data: playersData } = await playerService.getPlayersByCoach(user.id)
      if (playersData) {
        setPlayers(playersData)
        setStats((prev) => ({ ...prev, totalPlayers: playersData.length }))
      }

      // Load upcoming sessions
      const today = new Date().toISOString()
      const { data: sessionsData } = await practiceService.getSessionsByCoach(user.id, {
        status: 'scheduled',
        startDate: today,
      })
      if (sessionsData) {
        setUpcomingSessions(sessionsData.slice(0, 5))
        setStats((prev) => ({ ...prev, totalSessions: sessionsData.length }))
      }

      // Load custom drills
      const { data: drillsData } = await drillService.getCustomDrillsByCoach(user.id)
      if (drillsData) {
        setCustomDrills(drillsData)
        setStats((prev) => ({ ...prev, customDrills: drillsData.length }))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Coach Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Players</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalPlayers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Upcoming Sessions</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalSessions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Custom Drills</h3>
          <p className="text-3xl font-bold mt-2">{stats.customDrills}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Players List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Players</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          {players.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No players yet</p>
          ) : (
            <div className="space-y-3">
              {players.slice(0, 5).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {player.display_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{player.display_name}</p>
                      <p className="text-sm text-gray-500">{player.position || 'Player'}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(session.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {session.location && (
                        <p className="text-sm text-gray-500">📍 {session.location}</p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {session.duration_minutes}min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium">Schedule Session</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Create Drill</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">👤</div>
            <div className="text-sm font-medium">Invite Player</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">View Reports</div>
          </button>
        </div>
      </div>
    </div>
  )
}
