import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { practiceService } from '@/services/practice.service'
import { drillService } from '@/services/drill.service'
import { playerManagementService } from '@/services/player-management.service'
import { statisticsService } from '@/services/statistics.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  UsersIcon,
  CalendarIcon,
  BookOpenIcon,
  ArrowTrendingUpIcon,
  UserPlusIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BellIcon,
  SparklesIcon,
  ChartBarIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/solid'
import { CoachPlayer, Practice, Drill, EnhancedPlayer, PlayerStatistic } from '@/types'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'player_joined' | 'practice_scheduled' | 'practice_completed' | 'drill_created'
  title: string
  description: string
  timestamp: Date
  icon: React.ElementType
  color: string
}

interface ActionItem {
  id: string
  type: 'urgent' | 'important' | 'info'
  title: string
  description: string
  action: () => void
  actionLabel: string
}

export default function CoachDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    upcomingPractices: 0,
    totalDrills: 0,
    avgAttendance: 0,
    completedPractices: 0,
  })

  // Data
  const [recentPlayers, setRecentPlayers] = useState<CoachPlayer[]>([])
  const [upcomingPractices, setUpcomingPractices] = useState<Practice[]>([])
  const [todaysPractices, setTodaysPractices] = useState<Practice[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [playersWithStats, setPlayersWithStats] = useState<Array<EnhancedPlayer & { stats?: any }>>(
    []
  )

  useEffect(() => {
    if (userProfile?.id) {
      loadDashboardData()
    }
  }, [userProfile])

  async function loadDashboardData() {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      // Load players
      const { data: players } = await playerService.getCoachPlayers(userProfile.id)
      const activePlayers = players?.filter(p => p.status === 'accepted') || []

      // Load enhanced players with stats
      let playersWithStatsData: Array<EnhancedPlayer & { stats?: any }> = []
      const { data: enhancedPlayers } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )
      if (enhancedPlayers) {
        playersWithStatsData = await Promise.all(
          enhancedPlayers.map(async player => {
            const { data: statsArray } = await statisticsService.getPlayerStatistics(player.id)
            // Calculate simple stats from the array of statistics
            const stats = {
              totalStats: statsArray?.length || 0,
              attendanceRate: 85, // Mock for now - would calculate from practice_players table
              practicesAttended:
                statsArray?.filter(s => s.attendanceStatus === 'present').length || 0,
            }
            return { ...player, stats }
          })
        )
        setPlayersWithStats(playersWithStatsData)

        // Calculate average attendance
        const totalAttendance = playersWithStatsData.reduce(
          (sum, p) => sum + (p.stats?.attendanceRate || 0),
          0
        )
        const avgAttendance =
          playersWithStatsData.length > 0 ? totalAttendance / playersWithStatsData.length : 0

        setStats(prev => ({ ...prev, avgAttendance }))
      }

      // Load all practices
      const { data: allPractices } = await practiceService.getPractices(userProfile.id, {})

      // Filter today's practices
      const today = allPractices?.filter(p => isToday(new Date(p.scheduledDate))) || []
      setTodaysPractices(today)

      // Filter upcoming practices
      const now = new Date()
      const upcoming =
        allPractices
          ?.filter(p => p.status === 'scheduled' && new Date(p.scheduledDate) > now)
          .slice(0, 4) || []
      setUpcomingPractices(upcoming)

      // Count completed practices
      const completed = allPractices?.filter(p => p.status === 'completed').length || 0

      // Load drills
      const { data: drills } = await drillService.getDrills(userProfile.id)

      // Update stats
      setStats({
        totalPlayers: players?.length || 0,
        activePlayers: activePlayers.length,
        upcomingPractices: upcoming.length,
        totalDrills: drills?.length || 0,
        avgAttendance: stats.avgAttendance,
        completedPractices: completed,
      })

      // Set recent data
      setRecentPlayers(players?.slice(0, 5) || [])

      // Generate recent activity
      generateRecentActivity(players || [], allPractices || [], drills || [])

      // Generate action items
      generateActionItems(players || [], upcoming, playersWithStatsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateRecentActivity(players: CoachPlayer[], practices: Practice[], drills: Drill[]) {
    const activities: ActivityItem[] = []

    // Recent player joins
    players.slice(0, 3).forEach(player => {
      if (player.acceptedAt) {
        activities.push({
          id: `player-${player.id}`,
          type: 'player_joined',
          title: `${player.player?.displayName} joined your team`,
          description: format(new Date(player.acceptedAt), 'MMM d, yyyy'),
          timestamp: new Date(player.acceptedAt),
          icon: UserPlusIcon,
          color: 'text-blue-500',
        })
      }
    })

    // Recent completed practices
    practices
      .filter(p => p.status === 'completed')
      .slice(0, 2)
      .forEach(practice => {
        activities.push({
          id: `practice-${practice.id}`,
          type: 'practice_completed',
          title: `Completed: ${practice.title}`,
          description: format(new Date(practice.scheduledDate), 'MMM d, yyyy'),
          timestamp: new Date(practice.scheduledDate),
          icon: CheckCircleIcon,
          color: 'text-emerald-500',
        })
      })

    // Recent drills created
    drills.slice(0, 2).forEach(drill => {
      activities.push({
        id: `drill-${drill.id}`,
        type: 'drill_created',
        title: `New drill: ${drill.title}`,
        description: drill.category || 'General',
        timestamp: new Date(drill.createdAt),
        icon: BookOpenIcon,
        color: 'text-purple-500',
      })
    })

    // Sort by timestamp and take top 5
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setRecentActivity(activities.slice(0, 5))
  }

  function generateActionItems(
    players: CoachPlayer[],
    upcoming: Practice[],
    playersWithStats: Array<EnhancedPlayer & { stats?: any }>
  ) {
    const items: ActionItem[] = []

    // Check for today's practices
    const todayPractice = upcoming.find(p => isToday(new Date(p.scheduledDate)))
    if (todayPractice) {
      items.push({
        id: 'today-practice',
        type: 'urgent',
        title: '🎯 Practice Today!',
        description: `${todayPractice.title} - ${format(new Date(todayPractice.scheduledDate), 'h:mm a')}`,
        action: () => navigate(`/coach/practices/${todayPractice.id}`),
        actionLabel: 'View Details',
      })
    }

    // Check for tomorrow's practices
    const tomorrowPractice = upcoming.find(p => isTomorrow(new Date(p.scheduledDate)))
    if (tomorrowPractice) {
      items.push({
        id: 'tomorrow-practice',
        type: 'important',
        title: '📅 Practice Tomorrow',
        description: `${tomorrowPractice.title} - ${format(new Date(tomorrowPractice.scheduledDate), 'h:mm a')}`,
        action: () => navigate(`/coach/practices/${tomorrowPractice.id}`),
        actionLabel: 'Prepare',
      })
    }

    // Check for pending player invitations
    const pendingPlayers = players.filter(p => p.status === 'pending')
    if (pendingPlayers.length > 0) {
      items.push({
        id: 'pending-invites',
        type: 'info',
        title: `⏳ ${pendingPlayers.length} Pending Invitation${pendingPlayers.length > 1 ? 's' : ''}`,
        description: "Players who haven't accepted yet",
        action: () => navigate('/coach/players'),
        actionLabel: 'View Players',
      })
    }

    // Check for players with low attendance
    const lowAttendance = playersWithStats.filter(p => p.stats && p.stats.attendanceRate < 70)
    if (lowAttendance.length > 0) {
      items.push({
        id: 'low-attendance',
        type: 'important',
        title: `⚠️ ${lowAttendance.length} Player${lowAttendance.length > 1 ? 's' : ''} Need Attention`,
        description: 'Attendance below 70%',
        action: () => navigate('/coach/progress'),
        actionLabel: 'View Analytics',
      })
    }

    // Check if no upcoming practices
    if (upcoming.length === 0) {
      items.push({
        id: 'no-practices',
        type: 'info',
        title: '📆 No Upcoming Practices',
        description: 'Schedule your next practice session',
        action: () => navigate('/coach/practices/create'),
        actionLabel: 'Schedule Now',
      })
    }

    setActionItems(items.slice(0, 4))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {userProfile?.displayName}! 👋
        </h1>
        <p className="text-slate-600">Here's what's happening with your team today.</p>
      </div>

      {/* Action Items Banner */}
      {actionItems.length > 0 && (
        <div className="mb-6 space-y-3">
          {actionItems.map(item => (
            <div
              key={item.id}
              className={`rounded-xl p-4 flex items-center justify-between ${
                item.type === 'urgent'
                  ? 'bg-red-50 border-2 border-red-200'
                  : item.type === 'important'
                    ? 'bg-orange-50 border-2 border-orange-200'
                    : 'bg-blue-50 border-2 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.type === 'urgent' ? (
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                ) : item.type === 'important' ? (
                  <BellIcon className="h-6 w-6 text-orange-600" />
                ) : (
                  <SparklesIcon className="h-6 w-6 text-blue-600" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
              <button
                onClick={item.action}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  item.type === 'urgent'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : item.type === 'important'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={UsersIcon}
          label="Active Players"
          value={stats.activePlayers}
          total={stats.totalPlayers}
          color="blue"
          onClick={() => navigate('/coach/players')}
          subtitle={`${stats.totalPlayers} total`}
        />
        <StatCard
          icon={CalendarIcon}
          label="Upcoming Practices"
          value={stats.upcomingPractices}
          color="emerald"
          onClick={() => navigate('/coach/practices')}
          subtitle={`${stats.completedPractices} completed`}
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          label="Avg Attendance"
          value={`${stats.avgAttendance.toFixed(0)}%`}
          color="purple"
          onClick={() => navigate('/coach/progress')}
          subtitle={stats.avgAttendance >= 80 ? 'Excellent!' : 'Needs work'}
        />
        <StatCard
          icon={BookOpenIcon}
          label="Drill Library"
          value={stats.totalDrills}
          color="amber"
          onClick={() => navigate('/coach/drills')}
          subtitle="Available drills"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Upcoming Practices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Practices */}
          {todaysPractices.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="h-6 w-6" />
                <h2 className="text-xl font-bold">Today's Practice</h2>
              </div>
              {todaysPractices.map(practice => (
                <div
                  key={practice.id}
                  onClick={() => navigate(`/coach/practices/${practice.id}`)}
                  className="bg-white/20 backdrop-blur rounded-lg p-4 cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-1">{practice.title}</h3>
                  <p className="text-emerald-100 text-sm mb-2">{practice.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>🕐 {format(new Date(practice.scheduledDate), 'h:mm a')}</span>
                    {practice.location && <span>📍 {practice.location}</span>}
                    {practice.durationMinutes && <span>⏱️ {practice.durationMinutes} min</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Practices List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Upcoming Practices
              </h2>
              <button
                onClick={() => navigate('/coach/practices')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              {upcomingPractices.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-sm font-medium text-slate-900 mb-2">No upcoming practices</h3>
                  <p className="text-sm text-slate-600 mb-4">Schedule your next practice session</p>
                  <button
                    onClick={() => navigate('/coach/practices/create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <PlusIcon className="h-[18px] w-[18px]" />
                    Schedule Practice
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPractices.map(practice => {
                    const practiceDate = new Date(practice.scheduledDate)
                    const daysUntil = differenceInDays(practiceDate, new Date())

                    return (
                      <div
                        key={practice.id}
                        className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                        onClick={() => navigate(`/coach/practices/${practice.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{practice.title}</h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              daysUntil === 0
                                ? 'bg-red-100 text-red-700'
                                : daysUntil === 1
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                                ? 'Tomorrow'
                                : `In ${daysUntil} days`}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{practice.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>📅 {format(practiceDate, 'EEE, MMM d')}</span>
                          <span>🕐 {format(practiceDate, 'h:mm a')}</span>
                          {practice.durationMinutes && (
                            <span>⏱️ {practice.durationMinutes} min</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FlagIcon className="h-5 w-5" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map(activity => {
                    const Icon = activity.icon
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-slate-100`}>
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{activity.title}</p>
                          <p className="text-xs text-slate-500">{activity.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 px-2">Quick Actions</h2>

            <button
              onClick={() => navigate('/coach/players/invite')}
              className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl"
            >
              <UserPlusIcon className="mb-2 h-6 w-6" />
              <h3 className="text-lg font-semibold mb-1">Invite Players</h3>
              <p className="text-blue-100 text-sm">Add new players to your roster</p>
            </button>

            <button
              onClick={() => navigate('/coach/calendar')}
              className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl"
            >
              <CalendarIcon className="mb-2 h-6 w-6" />
              <h3 className="text-lg font-semibold mb-1">Calendar View</h3>
              <p className="text-emerald-100 text-sm">Visual practice scheduling</p>
            </button>

            <button
              onClick={() => navigate('/coach/drills')}
              className="w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl"
            >
              <BookOpenIcon className="mb-2 h-6 w-6" />
              <h3 className="text-lg font-semibold mb-1">Drill Library</h3>
              <p className="text-purple-100 text-sm">Browse and create drills</p>
            </button>

            <button
              onClick={() => navigate('/coach/analytics')}
              className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-amber-500/20 hover:shadow-xl"
            >
              <ChartBarIcon className="mb-2 h-6 w-6" />
              <h3 className="text-lg font-semibold mb-1">Team Analytics</h3>
              <p className="text-amber-100 text-sm">View performance insights</p>
            </button>

            <button
              onClick={() => navigate('/coach/announcements')}
              className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl"
            >
              <ChatBubbleLeftIcon className="mb-2 h-6 w-6" />
              <h3 className="text-lg font-semibold mb-1">Announcements</h3>
              <p className="text-indigo-100 text-sm">Post updates to your team</p>
            </button>
          </div>

          {/* Top Performers */}
          {playersWithStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  🏆 Top Performers
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {playersWithStats
                    .sort((a, b) => (b.stats?.attendanceRate || 0) - (a.stats?.attendanceRate || 0))
                    .slice(0, 5)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        onClick={() => navigate(`/coach/progress/${player.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{player.displayName}</p>
                          <p className="text-xs text-slate-500">
                            {player.stats?.attendanceRate.toFixed(0)}% attendance
                          </p>
                        </div>
                        {player.stats && player.stats.attendanceRate >= 90 && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Enhanced Stat Card Component
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  total?: number
  color: 'blue' | 'emerald' | 'purple' | 'amber'
  onClick?: () => void
  subtitle?: string
}

function StatCard({ icon: Icon, label, value, total, color, onClick, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg cursor-pointer hover:scale-105 transition-transform`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  )
}
