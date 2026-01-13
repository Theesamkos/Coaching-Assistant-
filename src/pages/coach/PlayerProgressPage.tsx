import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { statisticsService } from '@/services/statistics.service'
import { playerManagementService } from '@/services/player-management.service'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { EnhancedPlayer, PlayerStatistic, PracticeWithDetails, PlayerStatsAggregate } from '@/types'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function PlayerProgressPage() {
  const { id } = useParams<{ id: string }>()
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [player, setPlayer] = useState<EnhancedPlayer | null>(null)
  const [stats, setStats] = useState<PlayerStatsAggregate | null>(null)
  const [recentPractices, setRecentPractices] = useState<PracticeWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && userProfile?.id) {
      loadData()
    }
  }, [id, userProfile])

  const loadData = async () => {
    if (!id || !userProfile?.id) return

    setLoading(true)
    try {
      // Load player
      const { data: playersData } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )
      const playerData = playersData?.find((p) => p.id === id)

      if (playerData) {
        setPlayer(playerData)

        // Load stats
        const { data: statsData } = await statisticsService.getPlayerStatsAggregate(id)
        setStats(statsData)

        // Load recent practices with this player
        const { data: practicesData } = await practiceService.getPractices(userProfile.id, {})
        if (practicesData) {
          // Load full details for each practice to check if player is included
          const practicesWithDetails = await Promise.all(
            practicesData.map(async (practice) => {
              const { data: details } = await practiceService.getPracticeWithDetails(practice.id)
              return details
            })
          )
          
          // Filter practices that include this player
          const playerPractices = practicesWithDetails
            .filter((practice): practice is PracticeWithDetails => practice !== null)
            .filter((practice) =>
              practice.players?.some((p) => p.playerId === id)
            )
          setRecentPractices(playerPractices.slice(0, 10))
        }
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

  if (loading) {
    return (
      <DashboardLayout
        user={supabaseUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        role="coach"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading player progress...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!player) {
    return (
      <DashboardLayout
        user={supabaseUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        role="coach"
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Player Not Found</h2>
          <Button onClick={() => navigate('/coach/progress')}>Back to Progress</Button>
        </div>
      </DashboardLayout>
    )
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-400" />
      case 'excused':
        return <MinusCircleIcon className="h-5 w-5 text-yellow-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-slate-400" />
    }
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
          onClick={() => navigate('/coach/progress')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Progress Tracking
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{player.displayName}</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {player.position && (
                <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full">
                  {player.position}
                </span>
              )}
              {player.jerseyNumber && (
                <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full">
                  #{player.jerseyNumber}
                </span>
              )}
            </div>
          </div>
          <Button onClick={() => navigate(`/coach/players/${id}`)} variant="secondary">
            View Full Profile
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Practices */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Practices</p>
                <p className="text-3xl font-bold text-white">{stats.totalPractices}</p>
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Attendance Rate</p>
                <p className="text-3xl font-bold text-white">
                  {stats.attendanceRate.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full ${
                  stats.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${stats.attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Drills Completed */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Drills Completed</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalDrillsCompleted || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <FireIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-white">{stats.currentStreak || 0}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">consecutive practices</p>
          </div>
        </div>
      )}

      {/* Practice History */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Practice History</h2>
          <p className="text-sm text-slate-400 mt-1">
            {recentPractices.length} recent practices
          </p>
        </div>

        <div className="divide-y divide-slate-700">
          {recentPractices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No practice history available</div>
          ) : (
            recentPractices.map((practice) => {
              const playerAttendance = practice.players?.find((p) => p.playerId === id)
              const practiceDate = new Date(practice.scheduledDate)

              return (
                <div
                  key={practice.id}
                  className="p-6 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/coach/practices/${practice.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-white">{practice.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            practice.status === 'completed'
                              ? 'bg-slate-600 text-slate-300'
                              : practice.status === 'in_progress'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-blue-600/20 text-blue-400'
                          }`}
                        >
                          {practice.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(practiceDate, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{format(practiceDate, 'h:mm a')}</span>
                        </div>
                        {practice.durationMinutes && (
                          <span>{practice.durationMinutes} min</span>
                        )}
                      </div>

                      {practice.drills && practice.drills.length > 0 && (
                        <div className="mt-2 text-sm text-slate-400">
                          {practice.drills.length} drill{practice.drills.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {playerAttendance && (
                        <div className="flex items-center gap-2">
                          {getAttendanceIcon(playerAttendance.attendanceStatus)}
                          <span
                            className={`text-sm font-medium ${
                              playerAttendance.attendanceStatus === 'present'
                                ? 'text-emerald-400'
                                : playerAttendance.attendanceStatus === 'absent'
                                ? 'text-red-400'
                                : playerAttendance.attendanceStatus === 'excused'
                                ? 'text-yellow-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {playerAttendance.attendanceStatus || 'pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Performance Insights</h2>
        <div className="space-y-4">
          {stats && stats.attendanceRate >= 90 && (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-400">Excellent Attendance!</p>
                <p className="text-sm text-slate-300 mt-1">
                  {player.displayName} has maintained an outstanding attendance rate of{' '}
                  {stats.attendanceRate.toFixed(0)}%.
                </p>
              </div>
            </div>
          )}

          {stats && stats.currentStreak >= 5 && (
            <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <FireIcon className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-400">On Fire! 🔥</p>
                <p className="text-sm text-slate-300 mt-1">
                  {player.displayName} is on a {stats.currentStreak}-practice attendance streak!
                </p>
              </div>
            </div>
          )}

          {stats && stats.attendanceRate < 70 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-400">Needs Attention</p>
                <p className="text-sm text-slate-300 mt-1">
                  Attendance rate is below 70%. Consider reaching out to discuss any challenges.
                </p>
              </div>
            </div>
          )}

          {(!stats || stats.totalPractices === 0) && (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-400">Getting Started</p>
                <p className="text-sm text-slate-300 mt-1">
                  No practice data yet. Assign {player.displayName} to upcoming practices to start
                  tracking progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
