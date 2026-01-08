import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { playerManagementService } from '@/services/player-management.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  EnhancedPlayer,
  EnhancedPlayerFilters,
  InvitationStatus,
  SkillLevel,
} from '@/types'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function PlayersListPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  // State
  const [players, setPlayers] = useState<EnhancedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filters, setFilters] = useState<EnhancedPlayerFilters>({
    searchTerm: '',
    status: undefined,
    position: undefined,
    skillLevel: undefined,
    ageMin: undefined,
    ageMax: undefined,
  })

  // Load players
  useEffect(() => {
    if (userProfile?.id) {
      loadPlayers()
    }
  }, [userProfile, filters])

  const loadPlayers = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    const { data, error } = await playerManagementService.getCoachPlayersEnhanced(
      userProfile.id,
      filters
    )

    if (error) {
      console.error('Error loading players:', error)
    } else {
      setPlayers(data || [])
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    navigate('/login')
  }

  // Filter handlers
  const updateFilter = (key: keyof EnhancedPlayerFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: undefined,
      position: undefined,
      skillLevel: undefined,
      ageMin: undefined,
      ageMax: undefined,
    })
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.status ||
    filters.position ||
    filters.skillLevel ||
    filters.ageMin ||
    filters.ageMax

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Access denied. Coaches only.</div>
      </div>
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
          <h1 className="text-3xl font-bold text-white mb-2">Your Players</h1>
          <p className="text-slate-400">
            Manage your roster, track progress, and view detailed player profiles
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/coach/players/invite')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Invite Player
          </button>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Invitation Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) =>
                    updateFilter(
                      'status',
                      e.target.value ? (e.target.value as InvitationStatus) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  placeholder="e.g., Center, Defenseman"
                  value={filters.position || ''}
                  onChange={(e) => updateFilter('position', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Skill Level Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Skill Level
                </label>
                <select
                  value={filters.skillLevel || ''}
                  onChange={(e) =>
                    updateFilter(
                      'skillLevel',
                      e.target.value ? (e.target.value as SkillLevel) : undefined
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Age Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageMin || ''}
                    onChange={(e) =>
                      updateFilter('ageMin', e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageMax || ''}
                    onChange={(e) =>
                      updateFilter('ageMax', e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400">
          {loading ? 'Loading...' : `${players.length} player${players.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Players Display */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading players...</div>
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          hasFilters={!!hasActiveFilters}
          onClearFilters={clearFilters}
          onInvite={() => navigate('/coach/players/invite')}
        />
      ) : viewMode === 'grid' ? (
        <PlayerGrid players={players} onPlayerClick={(id) => navigate(`/coach/players/${id}`)} />
      ) : (
        <PlayerTable players={players} onPlayerClick={(id) => navigate(`/coach/players/${id}`)} />
      )}
    </DashboardLayout>
  )
}

// Empty State Component
interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
  onInvite: () => void
}

function EmptyState({ hasFilters, onClearFilters, onInvite }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">No players match your filters</h3>
        <p className="text-slate-400 mb-6">Try adjusting your search criteria</p>
        <button
          onClick={onClearFilters}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
      <div className="text-6xl mb-4">👥</div>
      <h3 className="text-xl font-semibold text-white mb-2">No players yet</h3>
      <p className="text-slate-400 mb-6">
        Start building your roster by inviting players to join your team
      </p>
      <button
        onClick={onInvite}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors inline-flex items-center gap-2"
      >
        <PlusIcon className="h-5 w-5" />
        Invite Your First Player
      </button>
    </div>
  )
}

// Grid View Component
interface PlayerGridProps {
  players: EnhancedPlayer[]
  onPlayerClick: (id: string) => void
}

function PlayerGrid({ players, onPlayerClick }: PlayerGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} onClick={() => onPlayerClick(player.id)} />
      ))}
    </div>
  )
}

// Player Card Component
interface PlayerCardProps {
  player: EnhancedPlayer
  onClick: () => void
}

function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
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

        <h3 className="text-lg font-semibold text-white text-center group-hover:text-blue-400 transition-colors">
          {player.displayName}
        </h3>

        {player.jerseyNumber && (
          <div className="mt-1 px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
            #{player.jerseyNumber}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        {player.position && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Position:</span>
            <span className="text-white font-medium">{player.position}</span>
          </div>
        )}

        {player.age !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Age:</span>
            <span className="text-white font-medium">{player.age}</span>
          </div>
        )}

        {player.skillLevel && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Level:</span>
            <span className="text-white font-medium capitalize">{player.skillLevel}</span>
          </div>
        )}

        {player.teams && player.teams.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Teams:</span>
            <span className="text-white font-medium">{player.teams.length}</span>
          </div>
        )}
      </div>

      {/* View Button */}
      <button className="w-full mt-4 py-2 bg-slate-700 group-hover:bg-blue-600 rounded-lg text-white transition-colors">
        View Profile
      </button>
    </div>
  )
}

// Table View Component
interface PlayerTableProps {
  players: EnhancedPlayer[]
  onPlayerClick: (id: string) => void
}

function PlayerTable({ players, onPlayerClick }: PlayerTableProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Jersey
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Skill Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Teams
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {players.map((player) => (
              <tr
                key={player.id}
                className="hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => onPlayerClick(player.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
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
                    <div>
                      <div className="text-sm font-medium text-white">{player.displayName}</div>
                      <div className="text-sm text-slate-400">{player.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {player.position || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {player.age || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {player.jerseyNumber ? `#${player.jerseyNumber}` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                  {player.skillLevel || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {player.teams?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayerClick(player.id)
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

