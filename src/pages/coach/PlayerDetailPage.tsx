import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerManagementService } from '@/services/player-management.service'
import { statisticsService } from '@/services/statistics.service'
import { noteService } from '@/services/note.service'
import { teamService } from '@/services/team.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { EnhancedPlayer, PlayerStatsAggregate, CoachNote, Team } from '@/types'
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

type TabType = 'profile' | 'stats' | 'notes' | 'teams'

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  // State
  const [player, setPlayer] = useState<EnhancedPlayer | null>(null)
  const [stats, setStats] = useState<PlayerStatsAggregate | null>(null)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  useEffect(() => {
    if (id && userProfile?.id) {
      loadPlayerData()
    }
  }, [id, userProfile])

  const loadPlayerData = async () => {
    if (!id || !userProfile?.id) return

    setLoading(true)

    try {
      // Load player profile
      const { data: playerData, error: playerError } =
        await playerManagementService.getPlayerProfile(id)
      if (!playerError && playerData) {
        setPlayer(playerData)
      }

      // Load player statistics
      const { data: statsData, error: statsError } =
        await statisticsService.getPlayerStatsAggregate(id)
      if (!statsError && statsData) {
        setStats(statsData)
      }

      // Load notes
      const { data: notesData, error: notesError } = await noteService.getPlayerNotes(
        id,
        userProfile.id
      )
      if (!notesError && notesData) {
        setNotes(notesData)
      }

      // Load teams
      const { data: teamsData, error: teamsError } = await teamService.getPlayerTeams(id)
      if (!teamsError && teamsData) {
        setTeams(teamsData)
      }
    } catch (error) {
      console.error('Error loading player data:', error)
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
          <div className="text-slate-400 text-lg">Loading player data...</div>
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
          <button
            onClick={() => navigate('/coach/players')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Back to Players
          </button>
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
      <div className="mb-6">
        <button
          onClick={() => navigate('/coach/players')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Players
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {player.photoURL ? (
                <img
                  src={player.photoURL}
                  alt={player.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                player.displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Name & Info */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{player.displayName}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                {player.position && <span>{player.position}</span>}
                {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                {player.age && <span>{player.age} years old</span>}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/coach/players/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<TrophyIcon className="h-6 w-6" />}
          label="Total Points"
          value={stats?.totalPoints || 0}
          color="bg-emerald-600"
        />
        <StatCard
          icon={<ChartBarIcon className="h-6 w-6" />}
          label="Practices"
          value={stats?.totalPractices || 0}
          color="bg-blue-600"
        />
        <StatCard
          icon={<DocumentTextIcon className="h-6 w-6" />}
          label="Notes"
          value={notes.length}
          color="bg-purple-600"
        />
        <StatCard
          icon={<UserGroupIcon className="h-6 w-6" />}
          label="Teams"
          value={teams.length}
          color="bg-amber-600"
        />
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-700 flex overflow-x-auto">
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<UserGroupIcon className="h-5 w-5" />}
            label="Profile"
          />
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon={<ChartBarIcon className="h-5 w-5" />}
            label="Statistics"
          />
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            icon={<DocumentTextIcon className="h-5 w-5" />}
            label={`Notes (${notes.length})`}
          />
          <TabButton
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
            icon={<UserGroupIcon className="h-5 w-5" />}
            label={`Teams (${teams.length})`}
          />
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab player={player} />}
          {activeTab === 'stats' && <StatsTab stats={stats} playerId={id!} />}
          {activeTab === 'notes' && <NotesTab notes={notes} playerId={id!} coachId={userProfile?.id!} onRefresh={loadPlayerData} />}
          {activeTab === 'teams' && <TeamsTab teams={teams} playerId={id!} />}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl p-4 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-90">{label}</span>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

// Tab Button Component
interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
        active
          ? 'text-white bg-slate-700 border-b-2 border-blue-500'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// Profile Tab
interface ProfileTabProps {
  player: EnhancedPlayer
}

function ProfileTab({ player }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Section title="Basic Information">
        <InfoGrid>
          <InfoItem label="Full Name" value={player.displayName} />
          <InfoItem label="Email" value={player.email} icon={<EnvelopeIcon className="h-5 w-5" />} />
          <InfoItem label="Phone" value={player.phone} icon={<PhoneIcon className="h-5 w-5" />} />
          <InfoItem label="Date of Birth" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : undefined} icon={<CalendarIcon className="h-5 w-5" />} />
        </InfoGrid>
      </Section>

      {/* Hockey Info */}
      <Section title="Hockey Information">
        <InfoGrid>
          <InfoItem label="Position" value={player.position} />
          <InfoItem label="Jersey Number" value={player.jerseyNumber} />
          <InfoItem label="Shoots" value={player.shoots} />
          <InfoItem label="Skill Level" value={player.skillLevel} capitalize />
          <InfoItem label="Height" value={player.heightInches ? `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"` : undefined} />
          <InfoItem label="Weight" value={player.weightLbs ? `${player.weightLbs} lbs` : undefined} />
          <InfoItem label="Experience" value={player.yearsExperience ? `${player.yearsExperience} years` : undefined} />
        </InfoGrid>
      </Section>

      {/* Contact Info */}
      {(player.addressLine1 || player.city || player.state) && (
        <Section title="Address">
          <InfoGrid>
            <InfoItem label="Street" value={player.addressLine1} icon={<MapPinIcon className="h-5 w-5" />} />
            <InfoItem label="Address Line 2" value={player.addressLine2} />
            <InfoItem label="City" value={player.city} />
            <InfoItem label="State" value={player.state} />
            <InfoItem label="ZIP Code" value={player.zipCode} />
            <InfoItem label="Country" value={player.country} />
          </InfoGrid>
        </Section>
      )}

      {/* Emergency Contact */}
      {player.emergencyContactName && (
        <Section title="Emergency Contact">
          <InfoGrid>
            <InfoItem label="Name" value={player.emergencyContactName} />
            <InfoItem label="Phone" value={player.emergencyContactPhone} />
            <InfoItem label="Relationship" value={player.emergencyContactRelationship} />
          </InfoGrid>
        </Section>
      )}

      {/* Parent/Guardian */}
      {player.parentName && (
        <Section title="Parent/Guardian">
          <InfoGrid>
            <InfoItem label="Name" value={player.parentName} />
            <InfoItem label="Email" value={player.parentEmail} />
            <InfoItem label="Phone" value={player.parentPhone} />
          </InfoGrid>
        </Section>
      )}

      {/* Medical Notes */}
      {player.medicalNotes && (
        <Section title="Medical Notes">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-200">{player.medicalNotes}</p>
          </div>
        </Section>
      )}
    </div>
  )
}

// Stats Tab
interface StatsTabProps {
  stats: PlayerStatsAggregate | null
  playerId: string
}

function StatsTab({ stats, playerId }: StatsTabProps) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">No statistics available yet</p>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
          Add Statistics
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Practice Stats */}
      <Section title="Practice Statistics">
        <InfoGrid>
          <InfoItem label="Total Practices" value={stats.totalPractices} />
          <InfoItem label="Attendance Rate" value={`${stats.attendanceRate}%`} />
          <InfoItem label="Average Rating" value={stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : '—'} />
        </InfoGrid>
      </Section>

      {/* Game Stats */}
      <Section title="Game Statistics">
        <InfoGrid>
          <InfoItem label="Goals" value={stats.totalGoals} />
          <InfoItem label="Assists" value={stats.totalAssists} />
          <InfoItem label="Total Points" value={stats.totalPoints} />
        </InfoGrid>
      </Section>

      {/* Skill Ratings */}
      {Object.keys(stats.skillAverages).length > 0 && (
        <Section title="Skill Ratings">
          <div className="space-y-3">
            {Object.entries(stats.skillAverages).map(([skill, rating]) => (
              <div key={skill}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 capitalize">{skill}</span>
                  <span className="text-white font-medium">{rating.toFixed(1)}/5</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${(rating / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// Notes Tab
interface NotesTabProps {
  notes: CoachNote[]
  playerId: string
  coachId: string
  onRefresh: () => void
}

function NotesTab({ notes, playerId, coachId, onRefresh }: NotesTabProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">No notes yet</p>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
          Add First Note
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
        Add New Note
      </button>

      {notes.map((note) => (
        <div key={note.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300 capitalize">
                {note.noteType}
              </span>
              {note.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-200">{note.content}</p>
          {note.isVisibleToPlayer && (
            <div className="mt-2 text-xs text-emerald-400">👁️ Visible to player</div>
          )}
        </div>
      ))}
    </div>
  )
}

// Teams Tab
interface TeamsTabProps {
  teams: Team[]
  playerId: string
}

function TeamsTab({ teams, playerId }: TeamsTabProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Player is not in any teams yet</p>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
          Add to Team
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((team) => (
        <div key={team.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-2">{team.name}</h3>
          {team.description && <p className="text-slate-300 text-sm mb-2">{team.description}</p>}
          {team.season && (
            <span className="inline-block px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
              {team.season}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper Components
interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

interface InfoItemProps {
  label: string
  value?: string | number | null
  icon?: React.ReactNode
  capitalize?: boolean
}

function InfoItem({ label, value, icon, capitalize }: InfoItemProps) {
  if (!value && value !== 0) return null

  return (
    <div className="flex items-start gap-3">
      {icon && <div className="text-slate-400 mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className={`text-white font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

