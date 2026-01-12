import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { practiceService } from '@/services/practice.service'
import { statisticsService } from '@/services/statistics.service'
import { noteService } from '@/services/note.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Award,
  Flame,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { CoachPlayer, PracticeWithDetails, PlayerStatistic, CoachNote } from '@/types'
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns'

export default function PlayerDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  
  // Stats
  const [stats, setStats] = useState<PlayerStatistics | null>(null)
  const [dashboardStats, setDashboardStats] = useState({
    coaches: 0,
    upcomingPractices: 0,
    completedDrills: 0,
    progressScore: '--',
  })
  
  // Data
  const [myCoaches, setMyCoaches] = useState<CoachPlayer[]>([])
  const [upcomingPractices, setUpcomingPractices] = useState<PracticeWithDetails[]>([])
  const [todaysPractices, setTodaysPractices] = useState<PracticeWithDetails[]>([])
  const [recentFeedback, setRecentFeedback] = useState<CoachNote[]>([])

  useEffect(() => {
    if (userProfile?.id) {
      loadDashboardData()
    }
  }, [userProfile])

  async function loadDashboardData() {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      // Load coaches
      const { data: coaches } = await playerService.getPlayerCoaches(userProfile.id)

      // Load practices
      const { data: practices } = await practiceService.getPlayerPractices(userProfile.id)
      
      // Filter today's practices
      const today = practices?.filter(p => isToday(new Date(p.scheduledDate))) || []
      setTodaysPractices(today)
      
      // Filter upcoming practices
      const upcoming = practices?.filter(
        (p) => new Date(p.scheduledDate) > new Date() && p.status === 'scheduled'
      ) || []
      setUpcomingPractices(upcoming.slice(0, 4))

      // Load player statistics
      const { data: playerStats } = await statisticsService.getPlayerStatistics(userProfile.id)
      setStats(playerStats)

      // Load recent feedback (notes visible to player)
      const { data: notes } = await noteService.getPlayerNotes(userProfile.id)
      const visibleNotes = notes?.filter(note => note.isVisibleToPlayer).slice(0, 5) || []
      setRecentFeedback(visibleNotes)

      // Count completed drills from practices
      const completedDrills = practices?.reduce((count, practice) => {
        if (practice.status === 'completed' && practice.drills) {
          return count + practice.drills.filter(d => d.completed).length
        }
        return count
      }, 0) || 0

      // Update stats
      setDashboardStats({
        coaches: coaches?.length || 0,
        upcomingPractices: upcoming.length,
        completedDrills,
        progressScore: playerStats?.attendanceRate ? `${playerStats.attendanceRate.toFixed(0)}%` : '--',
      })

      setMyCoaches(coaches || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
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
      {/* Welcome Banner */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {userProfile?.displayName}! 👋
        </h1>
        <p className="text-slate-600">Track your progress and stay on top of your training.</p>
      </div>

      {/* Today's Practice Alert */}
      {todaysPractices.length > 0 && (
        <div className="mb-6">
          {todaysPractices.map((practice) => (
            <div
              key={practice.id}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate(`/practices/${practice.id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6" />
                <h2 className="text-xl font-bold">Practice Today!</h2>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{practice.title}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span>🕐 {format(new Date(practice.scheduledDate), 'h:mm a')}</span>
                  {practice.location && <span>📍 {practice.location}</span>}
                  {practice.durationMinutes && <span>⏱️ {practice.durationMinutes} min</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Attendance Rate"
          value={dashboardStats.progressScore}
          color="blue"
          subtitle={stats ? `${stats.totalPractices} practices` : 'No data yet'}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Sessions"
          value={dashboardStats.upcomingPractices}
          color="emerald"
          subtitle="Scheduled practices"
        />
        <StatCard
          icon={CheckCircle}
          label="Drills Completed"
          value={dashboardStats.completedDrills}
          color="purple"
          subtitle="Total drills finished"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={stats?.currentStreak || 0}
          color="amber"
          subtitle="Days in a row"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Practices & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Widget */}
          {stats && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Progress
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Attendance Rate */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {stats.attendanceRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-600">Attendance</div>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.attendanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Total Practices */}
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {stats.totalPractices}
                  </div>
                  <div className="text-sm text-slate-600">Practices</div>
                  <div className="text-xs text-emerald-600 mt-2">
                    {stats.totalPractices >= 10 ? '🏆 Great commitment!' : 'Keep going!'}
                  </div>
                </div>

                {/* Streak */}
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-1 flex items-center justify-center gap-2">
                    <Flame className="h-8 w-8" />
                    {stats.currentStreak}
                  </div>
                  <div className="text-sm text-slate-600">Day Streak</div>
                  <div className="text-xs text-orange-600 mt-2">
                    {stats.currentStreak >= 5 ? '🔥 On fire!' : 'Build your streak!'}
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="mt-4 space-y-2">
                {stats.attendanceRate >= 90 && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Award className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Outstanding Attendance!</p>
                      <p className="text-xs text-emerald-700">You're in the top tier of performers!</p>
                    </div>
                  </div>
                )}
                {stats.currentStreak >= 7 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Amazing Streak!</p>
                      <p className="text-xs text-orange-700">Keep it up to reach 14 days!</p>
                    </div>
                  </div>
                )}
                {stats.attendanceRate < 70 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Let's Improve Together</p>
                      <p className="text-xs text-yellow-700">Try to attend more practices to boost your progress!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Practices */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Practices
              </h2>
              <button
                onClick={() => navigate('/practices')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="p-6">
              {upcomingPractices.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-sm font-medium text-slate-900 mb-2">No upcoming practices</h3>
                  <p className="text-sm text-slate-600">
                    Your coach will schedule practices soon
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPractices.map((practice) => {
                    const practiceDate = new Date(practice.scheduledDate)
                    const daysUntil = differenceInDays(practiceDate, new Date())
                    
                    return (
                      <div
                        key={practice.id}
                        className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                        onClick={() => navigate(`/practices/${practice.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{practice.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            daysUntil === 0 ? 'bg-red-100 text-red-700' :
                            daysUntil === 1 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                          </span>
                        </div>
                        {practice.description && (
                          <p className="text-sm text-slate-600 mb-2">{practice.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>📅 {format(practiceDate, 'EEE, MMM d')}</span>
                          <span>🕐 {format(practiceDate, 'h:mm a')}</span>
                          {practice.location && <span>📍 {practice.location}</span>}
                          {practice.drills && practice.drills.length > 0 && (
                            <span>📚 {practice.drills.length} drills</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coach Feedback Section */}
          {recentFeedback.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Recent Feedback from Coaches
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {recentFeedback.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        note.noteType === 'technical' ? 'bg-blue-600 text-white' :
                        note.noteType === 'physical' ? 'bg-emerald-600 text-white' :
                        note.noteType === 'mental' ? 'bg-purple-600 text-white' :
                        note.noteType === 'game' ? 'bg-orange-600 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {note.noteType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(note.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions & Coaches */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 px-2">Quick Actions</h2>
            
            <button
              onClick={() => navigate('/practices')}
              className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl"
            >
              <Calendar className="mb-2" size={24} />
              <h3 className="text-lg font-semibold mb-1">My Practices</h3>
              <p className="text-emerald-100 text-sm">View schedule & details</p>
            </button>

            <button
              onClick={() => navigate('/drills')}
              className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl"
            >
              <BookOpen className="mb-2" size={24} />
              <h3 className="text-lg font-semibold mb-1">Practice Drills</h3>
              <p className="text-blue-100 text-sm">Review assigned drills</p>
            </button>

            <button
              onClick={() => navigate('/progress')}
              className="w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl"
            >
              <TrendingUp className="mb-2" size={24} />
              <h3 className="text-lg font-semibold mb-1">My Progress</h3>
              <p className="text-purple-100 text-sm">Track your improvement</p>
            </button>

            <button
              onClick={() => navigate('/player/announcements')}
              className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl p-5 text-left transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl"
            >
              <MessageSquare className="mb-2" size={24} />
              <h3 className="text-lg font-semibold mb-1">Announcements</h3>
              <p className="text-indigo-100 text-sm">View coach updates</p>
            </button>
          </div>

          {/* My Coaches */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Coaches
              </h2>
            </div>
            <div className="p-4">
              {myCoaches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600">
                    No coaches yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCoaches.map((cp) => (
                    <div
                      key={cp.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {cp.coach?.displayName?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{cp.coach?.displayName}</p>
                        <p className="text-xs text-slate-500">{cp.coach?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
  color: 'blue' | 'emerald' | 'purple' | 'amber'
  onClick?: () => void
  subtitle?: string
}

function StatCard({ icon: Icon, label, value, color, onClick, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } transition-transform`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon size={28} />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  )
}
