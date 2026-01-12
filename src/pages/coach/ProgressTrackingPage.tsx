import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { statisticsService } from '@/services/statistics.service'
import { playerManagementService } from '@/services/player-management.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { EnhancedPlayer, PlayerStatistics } from '@/types'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

type TimeRange = '7d' | '30d' | '90d' | 'all'

interface PlayerWithStats extends EnhancedPlayer {
  stats?: PlayerStatistics
}

export default function ProgressTrackingPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // Overall stats
  const [totalPractices, setTotalPractices] = useState(0)
  const [avgAttendance, setAvgAttendance] = useState(0)
  const [totalDrillsCompleted, setTotalDrillsCompleted] = useState(0)

  useEffect(() => {
    if (userProfile?.id) {
      loadData()
    }
  }, [userProfile, timeRange])

  const loadData = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      // Load players
      const { data: playersData } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )

      if (playersData) {
        // Load stats for each player
        const playersWithStats = await Promise.all(
          playersData.map(async (player) => {
            const { data: stats } = await statisticsService.getPlayerStatistics(player.id)
            return {
              ...player,
              stats,
            }
          })
        )

        setPlayers(playersWithStats)

        // Calculate overall stats
        const totalStats = playersWithStats.reduce(
          (acc, player) => {
            if (player.stats) {
              acc.practices += player.stats.totalPractices || 0
              acc.attendance += player.stats.attendanceRate || 0
              acc.drills += player.stats.totalDrillsCompleted || 0
            }
            return acc
          },
          { practices: 0, attendance: 0, drills: 0 }
        )

        setTotalPractices(totalStats.practices)
        setAvgAttendance(
          playersWithStats.length > 0 ? totalStats.attendance / playersWithStats.length : 0
        )
        setTotalDrillsCompleted(totalStats.drills)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '7d':
        return 'Last 7 Days'
      case '30d':
        return 'Last 30 Days'
      case '90d':
        return 'Last 90 Days'
      case 'all':
        return 'All Time'
    }
  }

  const selectedPlayerData = selectedPlayer
    ? players.find((p) => p.id === selectedPlayer)
    : null

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="coach"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Progress Tracking & Analytics</h1>
        <p className="text-slate-400">Monitor player performance and team progress</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-300 font-medium mr-2">Time Range:</span>
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {getTimeRangeLabel(range)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Practices */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Practices</p>
                  <p className="text-4xl font-bold text-white">{totalPractices}</p>
                </div>
                <div className="bg-blue-500/30 p-3 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <ClockIcon className="h-4 w-4" />
                <span>{getTimeRangeLabel(timeRange)}</span>
              </div>
            </div>

            {/* Average Attendance */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-200 text-sm font-medium mb-1">Avg Attendance</p>
                  <p className="text-4xl font-bold text-white">{avgAttendance.toFixed(1)}%</p>
                </div>
                <div className="bg-emerald-500/30 p-3 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-200 text-sm">
                {avgAttendance >= 80 ? (
                  <>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>Great attendance!</span>
                  </>
                ) : (
                  <>
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                    <span>Needs improvement</span>
                  </>
                )}
              </div>
            </div>

            {/* Total Drills Completed */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-purple-200 text-sm font-medium mb-1">Drills Completed</p>
                  <p className="text-4xl font-bold text-white">{totalDrillsCompleted}</p>
                </div>
                <div className="bg-purple-500/30 p-3 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-purple-200 text-sm">
                <FireIcon className="h-4 w-4" />
                <span>Across all players</span>
              </div>
            </div>
          </div>

          {/* Player Selection and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h2 className="text-xl font-semibold text-white">Players</h2>
                  <p className="text-sm text-slate-400 mt-1">{players.length} total</p>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No players found</div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {players.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => setSelectedPlayer(player.id)}
                          className={`w-full text-left p-4 transition-colors ${
                            selectedPlayer === player.id
                              ? 'bg-blue-600/20 border-l-4 border-blue-500'
                              : 'hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{player.displayName}</span>
                            {player.stats && player.stats.attendanceRate >= 90 && (
                              <TrophyIcon className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>

                          {player.stats && (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between text-slate-400">
                                <span>Attendance:</span>
                                <span
                                  className={
                                    player.stats.attendanceRate >= 80
                                      ? 'text-emerald-400'
                                      : 'text-yellow-400'
                                  }
                                >
                                  {player.stats.attendanceRate.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Practices:</span>
                                <span className="text-white">{player.stats.totalPractices}</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player Details */}
            <div className="lg:col-span-2">
              {selectedPlayerData ? (
                <div className="space-y-6">
                  {/* Player Header */}
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          {selectedPlayerData.displayName}
                        </h2>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                          {selectedPlayerData.position && (
                            <span className="px-3 py-1 bg-slate-700 rounded-full">
                              {selectedPlayerData.position}
                            </span>
                          )}
                          {selectedPlayerData.jerseyNumber && (
                            <span className="px-3 py-1 bg-slate-700 rounded-full">
                              #{selectedPlayerData.jerseyNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/coach/progress/${selectedPlayerData.id}`)}
                          variant="secondary"
                        >
                          Detailed Progress
                        </Button>
                        <Button
                          onClick={() => navigate(`/coach/players/${selectedPlayerData.id}`)}
                          variant="secondary"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  {selectedPlayerData.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Practices Attended */}
                      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-500/20 p-2 rounded-lg">
                            <ChartBarIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Practices Attended</p>
                            <p className="text-2xl font-bold text-white">
                              {selectedPlayerData.stats.totalPractices}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Rate */}
                      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-emerald-500/20 p-2 rounded-lg">
                            <UserGroupIcon className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Attendance Rate</p>
                            <p className="text-2xl font-bold text-white">
                              {selectedPlayerData.stats.attendanceRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              selectedPlayerData.stats.attendanceRate >= 80
                                ? 'bg-emerald-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${selectedPlayerData.stats.attendanceRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Drills Completed */}
                      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-purple-500/20 p-2 rounded-lg">
                            <TrophyIcon className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Drills Completed</p>
                            <p className="text-2xl font-bold text-white">
                              {selectedPlayerData.stats.totalDrillsCompleted || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Streak */}
                      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-orange-500/20 p-2 rounded-lg">
                            <FireIcon className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Current Streak</p>
                            <p className="text-2xl font-bold text-white">
                              {selectedPlayerData.stats.currentStreak || 0} days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-slate-400 text-center py-8">
                        Detailed activity timeline coming soon
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-12">
                  <div className="text-center text-slate-400">
                    <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a player to view their progress</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
