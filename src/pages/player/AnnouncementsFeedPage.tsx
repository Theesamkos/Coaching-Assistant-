import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { announcementService } from '@/services/announcement.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Announcement } from '@/types'
import {
  Megaphone,
  Pin,
  Users,
  User,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Bell,
} from 'lucide-react'
import { format } from 'date-fns'

export default function AnnouncementsFeedPage() {
  const { supabaseUser, userProfile } = useAuth()
  const navigate = useNavigate()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile?.id) {
      loadAnnouncements()
    }
  }, [userProfile])

  const loadAnnouncements = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      const { data } = await announcementService.getPlayerAnnouncements(userProfile.id)
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (announcementId: string) => {
    if (!userProfile?.id) return

    setMarkingRead(announcementId)
    try {
      await announcementService.markAsRead(announcementId, userProfile.id)
      await loadAnnouncements()
    } catch (error) {
      console.error('Error marking as read:', error)
    } finally {
      setMarkingRead(null)
    }
  }

  const handleLogout = async () => {
    navigate('/login')
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

  const unreadCount = announcements.filter((a) => !a.isRead).length
  const pinnedAnnouncements = announcements.filter((a) => a.isPinned)
  const regularAnnouncements = announcements.filter((a) => !a.isPinned)

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="player"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Megaphone className="h-8 w-8" />
          Announcements
        </h1>
        <p className="text-slate-400">Updates and messages from your coaches</p>
      </div>

      {/* Unread Banner */}
      {unreadCount > 0 && (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-400" />
          <div>
            <p className="font-semibold text-white">
              You have {unreadCount} unread announcement{unreadCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-slate-400">Click on announcements to mark them as read</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-lg">Loading announcements...</div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <Megaphone className="h-16 w-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-white mb-2">No Announcements</h2>
          <p className="text-slate-400">
            Your coaches haven't posted any announcements yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Pin className="h-5 w-5 text-blue-400" />
                Pinned
              </h2>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingRead={markingRead === announcement.id}
                    getPriorityColor={getPriorityColor}
                    getAudienceIcon={getAudienceIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          {regularAnnouncements.length > 0 && (
            <div>
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-lg font-semibold text-white mb-3">All Announcements</h2>
              )}
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingRead={markingRead === announcement.id}
                    getPriorityColor={getPriorityColor}
                    getAudienceIcon={getAudienceIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

// Announcement Card Component
interface AnnouncementCardProps {
  announcement: Announcement
  onMarkAsRead: (id: string) => void
  isMarkingRead: boolean
  getPriorityColor: (priority: string) => string
  getAudienceIcon: (audience: string) => JSX.Element
}

function AnnouncementCard({
  announcement,
  onMarkAsRead,
  isMarkingRead,
  getPriorityColor,
  getAudienceIcon,
}: AnnouncementCardProps) {
  const isExpired =
    announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

  return (
    <div
      className={`bg-slate-800 rounded-xl border transition-all ${
        announcement.isPinned
          ? 'border-blue-500'
          : announcement.isRead
          ? 'border-slate-700 opacity-80'
          : 'border-emerald-500'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {!announcement.isRead && (
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
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

              {/* Coach */}
              {announcement.coach && (
                <span className="text-xs text-slate-400">
                  From: {announcement.coach.displayName}
                </span>
              )}

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

          {/* Mark as Read */}
          {!announcement.isRead && (
            <button
              onClick={() => onMarkAsRead(announcement.id)}
              disabled={isMarkingRead}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Read
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-slate-300 whitespace-pre-wrap mb-4">{announcement.content}</p>

        {/* Footer */}
        <div className="flex items-center gap-4 text-sm">
          {announcement.targetAudience === 'individual' && (
            <div className="flex items-center gap-2 text-purple-400">
              <User className="h-4 w-4" />
              <span>Personal message</span>
            </div>
          )}
          {announcement.relatedPracticeId && (
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle className="h-4 w-4" />
              <span>Related to a practice</span>
            </div>
          )}
          {announcement.isRead && (
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle className="h-4 w-4" />
              <span>Read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
