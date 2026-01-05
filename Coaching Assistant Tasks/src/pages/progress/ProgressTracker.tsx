import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { progressService } from '@/services/progress.service'
import { goalService } from '@/services/goal.service'
import type { DrillCompletion, Goal, PlayerProgressSummary } from '@/types/database.types'

export default function ProgressTracker() {
  const { user } = useAuth()
  const [completions, setCompletions] = useState<DrillCompletion[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [summary, setSummary] = useState<PlayerProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    if (user?.id) {
      loadProgressData()
    }
  }, [user, timeFilter])

  const loadProgressData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Get date filters
      const endDate = new Date().toISOString()
      let startDate = ''
      if (timeFilter === 'week') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        startDate = date.toISOString()
      } else if (timeFilter === 'month') {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        startDate = date.toISOString()
      }

      // Load completions
      const { data: completionsData } = await progressService.getCompletionsByPlayer(user.id, {
        startDate: startDate || undefined,
        endDate,
      })
      if (completionsData) {
        setCompletions(completionsData)
      }

      // Load goals
      const { data: goalsData } = await goalService.getActiveGoals(user.id)
      if (goalsData) {
        setGoals(goalsData)
      }

      // Load summary
      const { data: summaryData } = await progressService.getPlayerProgress(user.id)
      if (summaryData) {
        setSummary(summaryData)
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAverageRating = () => {
    const ratingsWithValues = completions.filter((c) => c.performance_rating)
    if (ratingsWithValues.length === 0) return 0
    const sum = ratingsWithValues.reduce((acc, c) => acc + (c.performance_rating || 0), 0)
    return (sum / ratingsWithValues.length).toFixed(1)
  }

  const getCompletionsByCategory = () => {
    const categories: Record<string, number> = {}
    completions.forEach((completion: any) => {
      const category = completion.drill?.category || 'other'
      categories[category] = (categories[category] || 0) + 1
    })
    return categories
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading progress data...</div>
      </div>
    )
  }

  const categories = getCompletionsByCategory()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Progress</h1>
        
        {/* Time Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-4 py-2 rounded-lg ${
              timeFilter === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-4 py-2 rounded-lg ${
              timeFilter === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              timeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Completions</h3>
          <p className="text-3xl font-bold mt-2">{summary?.total_completions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Sessions</h3>
          <p className="text-3xl font-bold mt-2">{summary?.total_sessions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Unique Drills</h3>
          <p className="text-3xl font-bold mt-2">{summary?.unique_drills_completed || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Avg Performance</h3>
          <p className="text-3xl font-bold mt-2">{getAverageRating()} ⭐</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completions by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Training by Category</h2>
          {Object.keys(categories).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categories).map(([category, count]) => {
                const total = completions.length
                const percentage = ((count / total) * 100).toFixed(0)
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <span className="text-sm text-gray-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
          {goals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active goals</p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{goal.title}</h3>
                    <span className="text-sm text-gray-500">{goal.progress_percentage}%</span>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-gray-500">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Completions</h2>
        {completions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Drill</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Rating</th>
                  <th className="text-left py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {completions.slice(0, 10).map((completion: any) => (
                  <tr key={completion.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {completion.drill?.title || 'Unknown Drill'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {completion.duration_minutes ? `${completion.duration_minutes} min` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {completion.performance_rating ? (
                        <div className="flex">
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
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {completion.player_notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
