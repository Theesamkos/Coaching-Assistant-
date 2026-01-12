import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import {
  PracticeWithDetails,
  AttendanceStatus,
  PracticeStatus,
} from '@/types'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

type TabType = 'overview' | 'drills' | 'attendance'

export default function PracticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [practice, setPractice] = useState<PracticeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null)
  const [updatingDrill, setUpdatingDrill] = useState<string | null>(null)

  useEffect(() => {
    if (id && userProfile?.id) {
      loadPracticeData()
    }
  }, [id, userProfile])

  const loadPracticeData = async () => {
    if (!id) return

    setLoading(true)
    try {
      const { data, error } = await practiceService.getPracticeWithDetails(id)
      if (error) {
        console.error('Error loading practice:', error)
      } else {
        setPractice(data)
      }
    } catch (error) {
      console.error('Error loading practice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAttendance = async (playerId: string, status: AttendanceStatus) => {
    if (!id) return

    setUpdatingAttendance(playerId)
    try {
      const { error } = await practiceService.updatePlayerAttendance(id, playerId, status)
      if (!error) {
        // Reload practice data
        await loadPracticeData()
      } else {
        alert('Failed to update attendance')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Failed to update attendance')
    } finally {
      setUpdatingAttendance(null)
    }
  }

  const handleUpdatePracticeStatus = async (status: PracticeStatus) => {
    if (!id) return

    const { error } = await practiceService.updatePracticeStatus(id, status)
    if (!error) {
      await loadPracticeData()
    } else {
      alert('Failed to update practice status')
    }
  }

  const handleDeletePractice = async () => {
    if (!id || !confirm('Are you sure you want to delete this practice?')) return

    const { error } = await practiceService.deletePractice(id)
    if (!error) {
      navigate('/coach/practices')
    } else {
      alert('Failed to delete practice')
    }
  }

  const handleToggleDrillCompletion = async (drillId: string, currentStatus: boolean) => {
    if (!id) return

    setUpdatingDrill(drillId)
    try {
      const { error } = await practiceService.markDrillCompleted(id, drillId, !currentStatus)
      if (!error) {
        await loadPracticeData()
      } else {
        alert('Failed to update drill completion')
      }
    } catch (error) {
      console.error('Error updating drill completion:', error)
      alert('Failed to update drill completion')
    } finally {
      setUpdatingDrill(null)
    }
  }

  const handleLogout = async () => {
    navigate('/login')
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Access denied.</div>
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
          <div className="text-slate-400 text-lg">Loading practice...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!practice) {
    return (
      <DashboardLayout
        user={supabaseUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        role="coach"
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Practice Not Found</h2>
          <Button onClick={() => navigate('/coach/practices')}>Back to Practices</Button>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const practiceDate = new Date(practice.scheduledDate)

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
          onClick={() => navigate('/coach/practices')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Practices
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{practice.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  statusColors[practice.status as keyof typeof statusColors]
                }`}
              >
                {practice.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-slate-300">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <span>{format(practiceDate, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-slate-400" />
                <span>{format(practiceDate, 'h:mm a')}</span>
              </div>
              {practice.location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-slate-400" />
                  <span>{practice.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/coach/practices/${id}/edit`)}
              className="flex items-center gap-2"
            >
              <PencilIcon className="h-5 w-5" />
              Edit
            </Button>
            <Button onClick={handleDeletePractice} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {practice.status === 'scheduled' && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleUpdatePracticeStatus('in_progress')}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Practice
            </Button>
            <Button
              onClick={() => handleUpdatePracticeStatus('cancelled')}
              variant="secondary"
            >
              Cancel Practice
            </Button>
          </div>
        </div>
      )}

      {practice.status === 'in_progress' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-green-400 font-medium">Practice is currently in progress</p>
            <Button
              onClick={() => handleUpdatePracticeStatus('completed')}
              className="bg-slate-600 hover:bg-slate-700"
            >
              Mark as Completed
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
        <div className="border-b border-slate-700 flex overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'drills'}
            onClick={() => setActiveTab('drills')}
            label={`Drills (${practice.drills?.length || 0})`}
          />
          <TabButton
            active={activeTab === 'attendance'}
            onClick={() => setActiveTab('attendance')}
            label={`Attendance (${practice.players?.length || 0})`}
          />
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab practice={practice} />}
          {activeTab === 'drills' && (
            <DrillsTab
              practice={practice}
              onToggleCompletion={handleToggleDrillCompletion}
              updatingDrillId={updatingDrill}
            />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab
              practice={practice}
              onUpdateAttendance={handleUpdateAttendance}
              updatingPlayerId={updatingAttendance}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Tab Button
interface TabButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
        active
          ? 'text-white bg-slate-700 border-b-2 border-blue-500'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      {label}
    </button>
  )
}

// Overview Tab
function OverviewTab({ practice }: { practice: PracticeWithDetails }) {
  return (
    <div className="space-y-6">
      {practice.description && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
          <p className="text-slate-300">{practice.description}</p>
        </div>
      )}

      {practice.notes && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Coach Notes</h3>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-300 whitespace-pre-wrap">{practice.notes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Duration" value={`${practice.durationMinutes || '—'} min`} />
        <StatCard label="Drills" value={practice.drills?.length || 0} />
        <StatCard label="Players" value={practice.players?.length || 0} />
      </div>
    </div>
  )
}

// Drills Tab
interface DrillsTabProps {
  practice: PracticeWithDetails
  onToggleCompletion: (drillId: string, currentStatus: boolean) => void
  updatingDrillId: string | null
}

function DrillsTab({ practice, onToggleCompletion, updatingDrillId }: DrillsTabProps) {
  if (!practice.drills || practice.drills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No drills assigned to this practice</p>
      </div>
    )
  }

  const completedCount = practice.drills.filter((d) => d.completed).length
  const totalCount = practice.drills.length

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-medium">Drill Completion</span>
          <span className="text-white font-bold">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Drills List */}
      <div className="space-y-3">
        {practice.drills.map((practiceDrill, index) => (
          <div
            key={practiceDrill.id}
            className={`bg-slate-700 rounded-lg p-4 border transition-all ${
              practiceDrill.completed
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-slate-500">#{index + 1}</span>
                <button
                  onClick={() =>
                    onToggleCompletion(practiceDrill.drillId, practiceDrill.completed || false)
                  }
                  disabled={updatingDrillId === practiceDrill.drillId}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    practiceDrill.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500 hover:border-emerald-500'
                  } ${updatingDrillId === practiceDrill.drillId ? 'opacity-50' : ''}`}
                >
                  {practiceDrill.completed && <CheckCircleIcon className="h-4 w-4 text-white" />}
                </button>
              </div>
              <div className="flex-1">
                <h4
                  className={`text-lg font-semibold mb-1 ${
                    practiceDrill.completed ? 'text-slate-400 line-through' : 'text-white'
                  }`}
                >
                  {practiceDrill.drill?.title}
                </h4>
                {practiceDrill.drill?.description && (
                  <p className="text-slate-400 text-sm mb-2">{practiceDrill.drill.description}</p>
                )}
                <div className="flex gap-4 text-sm text-slate-300">
                  {practiceDrill.drill?.durationMinutes && (
                    <span>⏱️ {practiceDrill.drill.durationMinutes} min</span>
                  )}
                  {practiceDrill.drill?.category && <span>📁 {practiceDrill.drill.category}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Attendance Tab
interface AttendanceTabProps {
  practice: PracticeWithDetails
  onUpdateAttendance: (playerId: string, status: AttendanceStatus) => void
  updatingPlayerId: string | null
}

function AttendanceTab({ practice, onUpdateAttendance, updatingPlayerId }: AttendanceTabProps) {
  if (!practice.players || practice.players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No players assigned to this practice</p>
      </div>
    )
  }

  const attendanceStats = {
    present: practice.players.filter((p) => p.attendanceStatus === 'present').length,
    absent: practice.players.filter((p) => p.attendanceStatus === 'absent').length,
    late: practice.players.filter((p) => p.attendanceStatus === 'late').length,
    excused: practice.players.filter((p) => p.attendanceStatus === 'excused').length,
  }

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present" value={attendanceStats.present} color="text-green-400" />
        <StatCard label="Absent" value={attendanceStats.absent} color="text-red-400" />
        <StatCard label="Late" value={attendanceStats.late} color="text-yellow-400" />
        <StatCard label="Excused" value={attendanceStats.excused} color="text-blue-400" />
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {practice.players.map((practicePlayer) => (
          <div
            key={practicePlayer.id}
            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-white font-medium">{practicePlayer.player?.displayName}</h4>
                {practicePlayer.player?.position && (
                  <p className="text-sm text-slate-400">{practicePlayer.player.position}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateAttendance(practicePlayer.playerId, 'present')}
                  disabled={updatingPlayerId === practicePlayer.playerId}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    practicePlayer.attendanceStatus === 'present'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onUpdateAttendance(practicePlayer.playerId, 'absent')}
                  disabled={updatingPlayerId === practicePlayer.playerId}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    practicePlayer.attendanceStatus === 'absent'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onUpdateAttendance(practicePlayer.playerId, 'late')}
                  disabled={updatingPlayerId === practicePlayer.playerId}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    practicePlayer.attendanceStatus === 'late'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  ⚠️
                </button>
                <button
                  onClick={() => onUpdateAttendance(practicePlayer.playerId, 'excused')}
                  disabled={updatingPlayerId === practicePlayer.playerId}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    practicePlayer.attendanceStatus === 'excused'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  📝
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stat Card
interface StatCardProps {
  label: string
  value: string | number
  color?: string
}

function StatCard({ label, value, color = 'text-white' }: StatCardProps) {
  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
