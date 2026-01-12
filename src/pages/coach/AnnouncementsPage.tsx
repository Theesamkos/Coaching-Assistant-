import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { announcementService } from '@/services/announcement.service'
import { playerManagementService } from '@/services/player-management.service'
import { teamService } from '@/services/team.service'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import AnnouncementModal from '@/components/communication/AnnouncementModal'
import { Announcement, AnnouncementFormData, Team, EnhancedPlayer, Practice } from '@/types'
import {
  Megaphone,
  Plus,
  Pin,
  Edit,
  Trash2,
  Users,
  User,
  Target,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

export default function AnnouncementsPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<EnhancedPlayer[]>([])
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>()

  useEffect(() => {
    if (userProfile?.id) {
      loadData()
    }
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      // Load announcements
      const { data: announcementsData } = await announcementService.getCoachAnnouncements(
        userProfile.id
      )
      setAnnouncements(announcementsData || [])

      // Load teams
      const { data: teamsData } = await teamService.getCoachTeams(userProfile.id)
      setTeams(teamsData || [])

      // Load players
      const { data: playersData } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )
      setPlayers(playersData || [])

      // Load upcoming practices
      const { data: practicesData } = await practiceService.getPractices(userProfile.id, {})
      const upcoming = practicesData?.filter(p => new Date(p.scheduledDate) > new Date()) || []
      setPractices(upcoming.slice(0, 20))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (data: AnnouncementFormData) => {
    if (!userProfile?.id) return

    const { error } = await announcementService.createAnnouncement(userProfile.id, data)
    if (!error) {
      await loadData()
    } else {
      throw new Error(error.message)
    }
  }

  const handleUpdateAnnouncement = async (data: AnnouncementFormData) => {
    if (!editingAnnouncement) return

    const { error } = await announcementService.updateAnnouncement(editingAnnouncement.id, data)
    if (!error) {
      await loadData()
    } else {
      throw new Error(error.message)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    const { error } = await announcementService.deleteAnnouncement(announcementId)
    if (!error) {
      await loadData()
    } else {
      alert('Failed to delete announcement')
    }
  }

  const handleTogglePin = async (announcement: Announcement) => {
    const { error } = await announcementService.updateAnnouncement(announcement.id, {
      isPinned: !announcement.isPinned,
    })
    if (!error) {
      await loadData()
    }
  }

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingAnnouncement(undefined)
    setIsModalOpen(false)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Users className="h-4 w-4" />
      case 'team':
        return <Target className="h-4 w-4" />
      case 'individual':
        return <User className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Megaphone className="h-8 w-8" />
              Announcements
            </h1>
            <p className="text-slate-400">Communicate with your players and teams</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{announcements.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Pinned</p>
          <p className="text-2xl font-bold text-white">
            {announcements.filter((a) => a.isPinned).length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Urgent</p>
          <p className="text-2xl font-bold text-white">
            {announcements.filter((a) => a.priority === 'urgent').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-white">
            {
              announcements.filter(
                (a) => !a.expiresAt || new Date(a.expiresAt) > new Date()
              ).length
            }
          </p>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading announcements...</div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <Megaphone className="h-16 w-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-white mb-2">No Announcements Yet</h2>
          <p className="text-slate-400 mb-6">
            Create your first announcement to communicate with your team
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 mx-auto">
            <Plus className="h-5 w-5" />
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const isExpired =
              announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

            return (
              <div
                key={announcement.id}
                className={`bg-slate-800 rounded-xl border transition-all ${
                  announcement.isPinned
                    ? 'border-blue-500'
                    : isExpired
                    ? 'border-slate-700 opacity-60'
                    : 'border-slate-700'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.isPinned && (
                          <Pin className="h-5 w-5 text-blue-400" />
                        )}
                        <h3 className="text-xl font-semibold text-white">
                          {announcement.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Priority */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            announcement.priority
                          )}`}
                        >
                          {announcement.priority.toUpperCase()}
                        </span>

                        {/* Audience */}
                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                          {getAudienceIcon(announcement.targetAudience)}
                          {announcement.targetAudience === 'all' && 'All Players'}
                          {announcement.targetAudience === 'team' && 'Team'}
                          {announcement.targetAudience === 'individual' && 'Individual'}
                        </span>

                        {/* Published */}
                        <span className="text-xs text-slate-400">
                          {format(new Date(announcement.publishedAt), 'MMM d, yyyy h:mm a')}
                        </span>

                        {/* Expiration */}
                        {announcement.expiresAt && (
                          <span
                            className={`flex items-center gap-1 text-xs ${
                              isExpired ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isExpired ? 'Expired' : `Expires ${format(new Date(announcement.expiresAt), 'MMM d')}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePin(announcement)}
                        className={`p-2 rounded-lg transition-colors ${
                          announcement.isPinned
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                        title={announcement.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 bg-slate-700 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-slate-300 whitespace-pre-wrap mb-4">{announcement.content}</p>

                  {/* Footer Info */}
                  {announcement.relatedPracticeId && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Related to a practice</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
        announcement={editingAnnouncement}
        teams={teams}
        players={players}
        practices={practices}
      />
    </DashboardLayout>
  )
}
