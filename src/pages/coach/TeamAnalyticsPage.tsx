import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { statisticsService } from '@/services/statistics.service'
import { playerManagementService } from '@/services/player-management.service'
import { practiceService } from '@/services/practice.service'
import { teamService } from '@/services/team.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { EnhancedPlayer, PlayerStatistic, Practice, Team } from '@/types'
import {
  ChartBarIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface PlayerWithStats extends EnhancedPlayer {
  stats?: PlayerStatistics
}

export default function TeamAnalyticsPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [practices, setPractices] = useState<Practice[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all')

  useEffect(() => {
    if (userProfile?.id) {
      loadData()
    }
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      // Load players
      const { data: playersData } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )

      if (playersData) {
        const playersWithStats = await Promise.all(
          playersData.map(async (player) => {
            const { data: stats } = await statisticsService.getPlayerStatistics(player.id)
            return { ...player, stats }
          })
        )
        setPlayers(playersWithStats)
      }

      // Load practices
      const { data: practicesData } = await practiceService.getPractices(userProfile.id, {})
      setPractices(practicesData || [])

      // Load teams
      const { data: teamsData } = await teamService.getCoachTeams(userProfile.id)
      setTeams(teamsData || [])
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

  // Filter players by selected team
  const filteredPlayers =
    selectedTeam === 'all'
      ? players
      : players.filter((p) => p.teams?.some((t) => t.id === selectedTeam))

  // Calculate team statistics
  const totalPlayers = filteredPlayers.length
  const activePlayers = filteredPlayers.filter((p) => p.status === 'accepted').length

  const avgAttendance =
    filteredPlayers.length > 0
      ? filteredPlayers.reduce((sum, p) => sum + (p.stats?.attendanceRate || 0), 0) /
        filteredPlayers.length
      : 0

  const totalPractices = practices.filter((p) => p.status === 'completed').length

  const upcomingPractices = practices.filter(
    (p) => p.status === 'scheduled' && new Date(p.scheduledDate) > new Date()
  ).length

  const topPerformers = [...filteredPlayers]
    .sort((a, b) => (b.stats?.attendanceRate || 0) - (a.stats?.attendanceRate || 0))
    .slice(0, 5)

  const needsAttention = filteredPlayers.filter(
    (p) => p.stats && p.stats.attendanceRate < 70
  ).length

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="coach"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Team Analytics</h1>
        <p className="text-slate-400">Comprehensive overview of your team's performance</p>
      </div>

      {/* Team Filter */}
      {teams.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-300 font-medium mr-2">Filter by Team:</span>
            <button
              onClick={() => setSelectedTeam('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTeam === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All Players
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTeam === team.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Players */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Players</p>
                  <p className="text-4xl font-bold text-white">{totalPlayers}</p>
                </div>
                <div className="bg-blue-500/30 p-3 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-blue-200 text-sm">{activePlayers} active</p>
            </div>

            {/* Average Attendance */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-200 text-sm font-medium mb-1">Avg Attendance</p>
                  <p className="text-4xl font-bold text-white">{avgAttendance.toFixed(0)}%</p>
                </div>
                <div className="bg-emerald-500/30 p-3 rounded-lg">
                  {avgAttendance >= 80 ? (
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <p className="text-emerald-200 text-sm">
                {avgAttendance >= 80 ? 'Excellent!' : 'Needs improvement'}
              </p>
            </div>

            {/* Completed Practices */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-purple-200 text-sm font-medium mb-1">Completed</p>
                  <p className="text-4xl font-bold text-white">{totalPractices}</p>
                </div>
                <div className="bg-purple-500/30 p-3 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-purple-200 text-sm">{upcomingPractices} upcoming</p>
            </div>

            {/* Needs Attention */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-orange-200 text-sm font-medium mb-1">Needs Attention</p>
                  <p className="text-4xl font-bold text-white">{needsAttention}</p>
                </div>
                <div className="bg-orange-500/30 p-3 rounded-lg">
                  <FireIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-orange-200 text-sm">Players below 70% attendance</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <TrophyIcon className="h-6 w-6 text-yellow-500" />
                  Top Performers
                </h2>
                <p className="text-sm text-slate-400 mt-1">Based on attendance rate</p>
              </div>

              <div className="divide-y divide-slate-700">
                {topPerformers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No data available</div>
                ) : (
                  topPerformers.map((player, index) => (
                    <div
                      key={player.id}
                      className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/coach/progress/${player.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl font-bold ${
                              index === 0
                                ? 'text-yellow-500'
                                : index === 1
                                ? 'text-slate-400'
                                : index === 2
                                ? 'text-orange-600'
                                : 'text-slate-500'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-white">{player.displayName}</p>
                            {player.position && (
                              <p className="text-sm text-slate-400">{player.position}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            {player.stats?.attendanceRate.toFixed(0)}%
                          </p>
                          <p className="text-sm text-slate-400">
                            {player.stats?.totalPractices || 0} practices
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attendance Distribution */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ChartBarIcon className="h-6 w-6 text-blue-500" />
                  Attendance Distribution
                </h2>
                <p className="text-sm text-slate-400 mt-1">Player breakdown by attendance</p>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { label: 'Excellent (90%+)', min: 90, color: 'emerald' },
                  { label: 'Good (80-89%)', min: 80, max: 89, color: 'blue' },
                  { label: 'Fair (70-79%)', min: 70, max: 79, color: 'yellow' },
                  { label: 'Needs Improvement (<70%)', min: 0, max: 69, color: 'red' },
                ].map((range) => {
                  const count = filteredPlayers.filter((p) => {
                    const rate = p.stats?.attendanceRate || 0
                    if (range.max !== undefined) {
                      return rate >= range.min && rate <= range.max
                    }
                    return rate >= range.min
                  }).length

                  const percentage = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0

                  return (
                    <div key={range.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">{range.label}</span>
                        <span className="text-white font-semibold">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full bg-${range.color}-500 transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Insights */}
          <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Insights & Recommendations</h2>
            <div className="space-y-3">
              {avgAttendance >= 90 && (
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-400">Outstanding Team Performance!</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Your team is maintaining an excellent average attendance rate of{' '}
                      {avgAttendance.toFixed(0)}%. Keep up the great work!
                    </p>
                  </div>
                </div>
              )}

              {needsAttention > 0 && (
                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <FireIcon className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-400">Players Need Support</p>
                    <p className="text-sm text-slate-300 mt-1">
                      {needsAttention} player{needsAttention !== 1 ? 's have' : ' has'} attendance
                      below 70%. Consider reaching out to understand any challenges they may be
                      facing.
                    </p>
                  </div>
                </div>
              )}

              {upcomingPractices > 0 && (
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400">Upcoming Practices</p>
                    <p className="text-sm text-slate-300 mt-1">
                      You have {upcomingPractices} practice{upcomingPractices !== 1 ? 's' : ''}{' '}
                      scheduled. Make sure all players are notified and prepared.
                    </p>
                  </div>
                </div>
              )}

              {totalPlayers === 0 && (
                <div className="flex items-start gap-3 p-4 bg-slate-700 border border-slate-600 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-300">Get Started</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Start by inviting players to your team to begin tracking analytics.
                    </p>
                    <Button
                      onClick={() => navigate('/coach/players/invite')}
                      variant="secondary"
                      className="mt-3"
                    >
                      Invite Players
                    </Button>
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
