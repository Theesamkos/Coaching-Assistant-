import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import { progressService } from '@/services/progress.service'
import { goalService } from '@/services/goal.service'
import type { PracticeSession, DrillCompletion, Goal } from '@/types/database.types'

export default function PlayerDashboard() {
  const { user } = useAuth()
  const [upcomingSessions, setUpcomingSessions] = useState<PracticeSession[]>([])
  const [recentCompletions, setRecentCompletions] = useState<DrillCompletion[]>([])
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompletions: 0,
    upcomingSessions: 0,
    activeGoals: 0,
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
      // Load upcoming sessions
      const { data: sessionsData } = await practiceService.getUpcomingSessions(user.id, 5)
      if (sessionsData) {
        setUpcomingSessions(sessionsData)
        setStats((prev) => ({ ...prev, upcomingSessions: sessionsData.length }))
      }

      // Load recent completions
      const { data: completionsData } = await progressService.getRecentCompletions(user.id, 5)
      if (completionsData) {
        setRecentCompletions(completionsData)
        setStats((prev) => ({ ...prev, totalCompletions: completionsData.length }))
      }

      // Load active goals
      const { data: goalsData } = await goalService.getActiveGoals(user.id)
      if (goalsData) {
        setActiveGoals(goalsData)
        setStats((prev) => ({ ...prev, activeGoals: goalsData.length }))
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
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Upcoming Sessions</h3>
          <p className="text-3xl font-bold mt-2">{stats.upcomingSessions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Recent Completions</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalCompletions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Active Goals</h3>
          <p className="text-3xl font-bold mt-2">{stats.activeGoals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Practice</h2>
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
                  className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{session.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {new Date(session.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(session.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {session.location && (
                        <p className="text-sm text-gray-600">📍 {session.location}</p>
                      )}
                      {session.description && (
                        <p className="text-sm text-gray-700 mt-2">{session.description}</p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">
                      {session.duration_minutes}min
                    </span>
                  </div>
                  <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    🤖 Ask AI for Preparation Tips
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Goals</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active goals</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{goal.title}</p>
                    <span className="text-xs text-gray-500">
                      {goal.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Drill Completions</h2>
        {recentCompletions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completions yet</p>
        ) : (
          <div className="space-y-3">
            {recentCompletions.map((completion: any) => (
              <div
                key={completion.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">{completion.drill?.title || 'Drill'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {completion.performance_rating && (
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < completion.performance_rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-medium">Log Completion</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Browse Drills</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium">Ask AI Coach</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">View Progress</div>
          </button>
        </div>
      </div>
    </div>
  )
}
