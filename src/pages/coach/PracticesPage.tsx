import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Practice, PracticeStatus } from '@/types'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  FunnelIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'

export default function PracticesPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  // State
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<PracticeStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (userProfile?.id) {
      loadPractices()
    }
  }, [userProfile])

  const loadPractices = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      const { data, error } = await practiceService.getPractices(userProfile.id)
      if (error) {
        console.error('Error loading practices:', error)
      } else {
        setPractices(data || [])
      }
    } catch (error) {
      console.error('Error loading practices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePractice = async (practiceId: string) => {
    if (!confirm('Are you sure you want to delete this practice?')) return

    const { error } = await practiceService.deletePractice(practiceId)
    if (!error) {
      setPractices(practices.filter((p) => p.id !== practiceId))
    } else {
      alert('Failed to delete practice')
    }
  }

  // Filter practices
  const filteredPractices = practices.filter((practice) => {
    // Status filter
    if (statusFilter !== 'all' && practice.status !== statusFilter) {
      return false
    }

    // Date filter
    const practiceDate = new Date(practice.scheduledDate)
    if (dateFilter === 'upcoming' && isPast(practiceDate)) {
      return false
    }
    if (dateFilter === 'past' && isFuture(practiceDate)) {
      return false
    }

    return true
  })

  // Group practices by date category
  const upcomingPractices = filteredPractices.filter((p) =>
    isFuture(new Date(p.scheduledDate))
  )
  const pastPractices = filteredPractices.filter((p) =>
    isPast(new Date(p.scheduledDate))
  )

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
          <div className="text-slate-400 text-lg">Loading practices...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="coach"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Practices</h1>
          <p className="text-slate-400">
            Schedule and manage your team practices
          </p>
        </div>

        <button
          onClick={() => navigate('/coach/practices/create')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Practice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {/* Date Filter */}
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setDateFilter('past')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Past
            </button>
          </div>

          {/* Status Filter */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PracticeStatus | 'all')}
              className="w-full sm:w-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-slate-400">
          {filteredPractices.length} practice{filteredPractices.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Practices List */}
      {filteredPractices.length === 0 ? (
        <EmptyState
          dateFilter={dateFilter}
          onCreatePractice={() => navigate('/coach/practices/create')}
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Practices */}
          {dateFilter !== 'past' && upcomingPractices.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Upcoming Practices ({upcomingPractices.length})
              </h2>
              <div className="space-y-4">
                {upcomingPractices.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    onClick={() => navigate(`/coach/practices/${practice.id}`)}
                    onDelete={() => handleDeletePractice(practice.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past Practices */}
          {dateFilter !== 'upcoming' && pastPractices.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Past Practices ({pastPractices.length})
              </h2>
              <div className="space-y-4">
                {pastPractices.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    onClick={() => navigate(`/coach/practices/${practice.id}`)}
                    onDelete={() => handleDeletePractice(practice.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

// Empty State Component
interface EmptyStateProps {
  dateFilter: 'all' | 'upcoming' | 'past'
  onCreatePractice: () => void
}

function EmptyState({ dateFilter, onCreatePractice }: EmptyStateProps) {
  const messages = {
    all: 'No practices scheduled yet',
    upcoming: 'No upcoming practices',
    past: 'No past practices',
  }

  return (
    <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
      <div className="text-6xl mb-4">📅</div>
      <h3 className="text-xl font-semibold text-white mb-2">{messages[dateFilter]}</h3>
      <p className="text-slate-400 mb-6">
        {dateFilter === 'all'
          ? 'Create your first practice to get started!'
          : 'Try adjusting your filters'}
      </p>
      {dateFilter !== 'past' && (
        <button
          onClick={onCreatePractice}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Your First Practice
        </button>
      )}
    </div>
  )
}

// Practice Card Component
interface PracticeCardProps {
  practice: Practice
  onClick: () => void
  onDelete: () => void
}

function PracticeCard({ practice, onClick, onDelete }: PracticeCardProps) {
  const practiceDate = new Date(practice.scheduledDate)
  const isPastPractice = isPast(practiceDate)

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const statusIcons = {
    scheduled: <CalendarIcon className="h-4 w-4" />,
    in_progress: <ClockIcon className="h-4 w-4" />,
    completed: <CheckCircleIcon className="h-4 w-4" />,
    cancelled: <XCircleIcon className="h-4 w-4" />,
  }

  // Date label
  let dateLabel = format(practiceDate, 'MMM d, yyyy')
  if (isToday(practiceDate)) {
    dateLabel = 'Today'
  } else if (isTomorrow(practiceDate)) {
    dateLabel = 'Tomorrow'
  }

  const timeLabel = format(practiceDate, 'h:mm a')

  return (
    <div
      className={`bg-slate-800 rounded-xl p-6 border transition-all cursor-pointer ${
        isPastPractice
          ? 'border-slate-700 opacity-75 hover:opacity-100'
          : 'border-slate-700 hover:border-blue-500'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white truncate">{practice.title}</h3>
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                statusColors[practice.status as keyof typeof statusColors]
              }`}
            >
              {statusIcons[practice.status as keyof typeof statusIcons]}
              {practice.status.replace('_', ' ')}
            </span>
          </div>

          {/* Description */}
          {practice.description && (
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{practice.description}</p>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{dateLabel}</span>
              <span className="text-slate-500">at</span>
              <span>{timeLabel}</span>
            </div>

            {practice.durationMinutes && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-slate-400" />
                <span>{practice.durationMinutes} min</span>
              </div>
            )}

            {practice.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-slate-400" />
                <span>{practice.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
