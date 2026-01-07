import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerService } from '@/services/player.service'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { CoachPlayer, PracticeWithDetails } from '@/types'

export default function PlayerDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    coaches: 0,
    upcomingPractices: 0,
    completedDrills: 0,
    progressScore: '--',
  })
  const [myCoaches, setMyCoaches] = useState<CoachPlayer[]>([])
  const [upcomingPractices, setUpcomingPractices] = useState<PracticeWithDetails[]>([])

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
      const upcoming = practices?.filter(
        (p) => new Date(p.scheduledDate) > new Date() && p.status === 'scheduled'
      ) || []

      // Update stats
      setStats({
        coaches: coaches?.length || 0,
        upcomingPractices: upcoming.length,
        completedDrills: 0, // TODO: Implement drill completion tracking
        progressScore: '--', // TODO: Implement progress scoring
      })

      setMyCoaches(coaches || [])
      setUpcomingPractices(upcoming.slice(0, 4))
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
      <div className="mb-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome to Your Training Portal! 🏒
        </h1>
        <p className="text-lg text-white/90">
          Track your progress, complete drills, and improve your skills with personalized coaching.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="My Coaches"
          value={stats.coaches}
          color="blue"
          onClick={() => navigate('/coaches')}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Sessions"
          value={stats.upcomingPractices}
          color="emerald"
          onClick={() => navigate('/practices')}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Drills"
          value={stats.completedDrills}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Progress Score"
          value={stats.progressScore}
          color="amber"
          onClick={() => navigate('/progress')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Practices */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                <p className="text-sm text-slate-600">
                  Your coach will schedule practices soon
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPractices.map((practice) => (
                  <div
                    key={practice.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                    onClick={() => navigate(`/practices/${practice.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{practice.title}</h4>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        {new Date(practice.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    {practice.description && (
                      <p className="text-sm text-slate-600 mb-2">{practice.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {practice.location && (
                        <span>📍 {practice.location}</span>
                      )}
                      {practice.durationMinutes && (
                        <span>⏱ {practice.durationMinutes} min</span>
                      )}
                      {practice.drills && practice.drills.length > 0 && (
                        <span>📚 {practice.drills.length} drills</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & AI */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/ai-assistant')}
            className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-purple-500/20"
          >
            <MessageSquare className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">AI Assistant</h3>
            <p className="text-purple-100 text-sm">Get help preparing for practice</p>
          </button>

          <button
            onClick={() => navigate('/drills')}
            className="w-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-blue-500/20"
          >
            <BookOpen className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">My Drills</h3>
            <p className="text-blue-100 text-sm">View assigned practice drills</p>
          </button>

          <button
            onClick={() => navigate('/progress')}
            className="w-full bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-emerald-500/20"
          >
            <TrendingUp className="mb-3" size={24} />
            <h3 className="text-lg font-semibold mb-1">My Progress</h3>
            <p className="text-emerald-100 text-sm">Track your improvement</p>
          </button>
        </div>
      </div>

      {/* My Coaches */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">My Coaches</h2>
        </div>
        <div className="p-6">
          {myCoaches.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-sm font-medium text-slate-900 mb-2">No coaches yet</h3>
              <p className="text-sm text-slate-600">
                Your coach will send you an invitation to join their team
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCoaches.map((cp) => (
                <div
                  key={cp.id}
                  className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {cp.coach?.displayName?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{cp.coach?.displayName}</p>
                      <p className="text-xs text-slate-600">{cp.coach?.email}</p>
                    </div>
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
  color: 'blue' | 'emerald' | 'purple' | 'amber'
  onClick?: () => void
}

function StatCard({ icon: Icon, label, value, color, onClick }: StatCardProps) {
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
        <Icon size={24} />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  )
}
