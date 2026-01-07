import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { practiceService } from '@/services/practice.service'
import { drillService } from '@/services/drill.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  UserPlus,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { CoachPlayer, Practice, Drill } from '@/types'

export default function CoachDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    upcomingPractices: 0,
    totalDrills: 0,
  })
  const [recentPlayers, setRecentPlayers] = useState<CoachPlayer[]>([])
  const [upcomingPractices, setUpcomingPractices] = useState<Practice[]>([])

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
      const activePlayers = players?.filter((p) => p.status === 'accepted') || []
      
      // Load practices
      const today = new Date()
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const { data: practices } = await practiceService.getPractices(userProfile.id, {
        startDate: today,
        endDate: nextMonth,
        status: 'scheduled',
      })

      // Load drills
      const { data: drills } = await drillService.getDrills(userProfile.id)

      // Update stats
      setStats({
        totalPlayers: players?.length || 0,
        activePlayers: activePlayers.length,
        upcomingPractices: practices?.length || 0,
        totalDrills: drills?.length || 0,
      })

      // Set recent data
      setRecentPlayers(players?.slice(0, 5) || [])
      setUpcomingPractices(practices?.slice(0, 3) || [])
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {userProfile?.displayName}! 👋
        </h1>
        <p className="text-slate-600">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Active Players"
          value={stats.activePlayers}
          total={stats.totalPlayers}
          color="blue"
          onClick={() => navigate('/players')}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Practices"
          value={stats.upcomingPractices}
          color="emerald"
          onClick={() => navigate('/practices')}
        />
        <StatCard
          icon={BookOpen}
          label="Total Drills"
          value={stats.totalDrills}
          color="purple"
          onClick={() => navigate('/drills')}
        />
        <StatCard
          icon={TrendingUp}
          label="Team Progress"
          value="--"
          color="amber"
          onClick={() => navigate('/progress')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Players */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Your Players</h2>
            <button
              onClick={() => navigate('/players')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-6">
            {recentPlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-sm font-medium text-slate-900 mb-2">No players yet</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Get started by inviting players to your team
                </p>
                <button
                  onClick={() => navigate('/players')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={18} />
                  Invite Players
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPlayers.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => navigate(`/players/${cp.playerId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {cp.player?.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{cp.player?.displayName}</p>
                        <p className="text-sm text-slate-600">{cp.player?.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cp.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : cp.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/players')}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-blue-500/20"
          >
            <UserPlus className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">Invite Players</h3>
            <p className="text-blue-100 text-sm">Add new players to your roster</p>
          </button>

          <button
            onClick={() => navigate('/drills')}
            className="w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">Create Drill</h3>
            <p className="text-purple-100 text-sm">Design a new practice drill</p>
          </button>

          <button
            onClick={() => navigate('/practices')}
            className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-emerald-500/20"
          >
            <Calendar className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">Schedule Practice</h3>
            <p className="text-emerald-100 text-sm">Plan your next session</p>
          </button>
        </div>
      </div>

      {/* Upcoming Practices */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Practices</h2>
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
              <p className="text-sm text-slate-600 mb-4">Schedule your first practice session</p>
              <button
                onClick={() => navigate('/practices')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
                Schedule Practice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPractices.map((practice) => (
                <div
                  key={practice.id}
                  className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={() => navigate(`/practices/${practice.id}`)}
                >
                  <h4 className="font-semibold text-slate-900 mb-2">{practice.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{practice.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(practice.scheduledDate).toLocaleDateString()}</span>
                    {practice.durationMinutes && <span>{practice.durationMinutes} min</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  total?: number
  color: 'blue' | 'emerald' | 'purple' | 'amber'
  onClick?: () => void
}

function StatCard({ icon: Icon, label, value, total, color, onClick }: StatCardProps) {
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
        <Icon size={24} />
        {total !== undefined && (
          <span className="text-sm opacity-90">
            of {total}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  )
}
