import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Announcement, AnnouncementFormData, AnnouncementPriority, AnnouncementAudience, Team, EnhancedPlayer, Practice } from '@/types'
import { AlertCircle, Pin, Clock } from 'lucide-react'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AnnouncementFormData) => Promise<void>
  announcement?: Announcement
  teams: Team[]
  players: EnhancedPlayer[]
  practices: Practice[]
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  announcement,
  teams,
  players,
  practices,
}: AnnouncementModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<AnnouncementPriority>('normal')
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('all')
  const [targetTeamId, setTargetTeamId] = useState('')
  const [targetPlayerId, setTargetPlayerId] = useState('')
  const [relatedPracticeId, setRelatedPracticeId] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title)
      setContent(announcement.content)
      setPriority(announcement.priority)
      setTargetAudience(announcement.targetAudience)
      setTargetTeamId(announcement.targetTeamId || '')
      setTargetPlayerId(announcement.targetPlayerId || '')
      setRelatedPracticeId(announcement.relatedPracticeId || '')
      setIsPinned(announcement.isPinned)
      setExpiresAt(announcement.expiresAt ? announcement.expiresAt.toISOString().slice(0, 16) : '')
    } else {
      resetForm()
    }
  }, [announcement, isOpen])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setPriority('normal')
    setTargetAudience('all')
    setTargetTeamId('')
    setTargetPlayerId('')
    setRelatedPracticeId('')
    setIsPinned(false)
    setExpiresAt('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setLoading(true)
    try {
      const formData: AnnouncementFormData = {
        title,
        content,
        priority,
        targetAudience,
        targetTeamId: targetAudience === 'team' ? targetTeamId : undefined,
        targetPlayerId: targetAudience === 'individual' ? targetPlayerId : undefined,
        relatedPracticeId: relatedPracticeId || undefined,
        isPinned,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }

      await onSubmit(formData)
      resetForm()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  const priorityOptions = [
    { value: 'low', label: '🟢 Low' },
    { value: 'normal', label: '🔵 Normal' },
    { value: 'high', label: '🟡 High' },
    { value: 'urgent', label: '🔴 Urgent' },
  ]

  const audienceOptions = [
    { value: 'all', label: 'All Players' },
    { value: 'team', label: 'Specific Team' },
    { value: 'individual', label: 'Individual Player' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={announcement ? 'Edit Announcement' : 'New Announcement'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Title *
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Practice Cancelled - Saturday"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Message *
          </label>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your announcement..."
            rows={5}
            required
          />
        </div>

        {/* Priority and Pinned */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              options={priorityOptions}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <Pin className="h-5 w-5 text-slate-400" />
              <span className="text-slate-300 text-sm font-medium">Pin to Top</span>
            </label>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Send To
          </label>
          <Select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudience)}
            options={audienceOptions}
          />
        </div>

        {/* Team Selection */}
        {targetAudience === 'team' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Team
            </label>
            <Select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              options={[
                { value: '', label: 'Choose a team...' },
                ...teams.map((team) => ({ value: team.id, label: team.name })),
              ]}
              required
            />
          </div>
        )}

        {/* Player Selection */}
        {targetAudience === 'individual' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Player
            </label>
            <Select
              value={targetPlayerId}
              onChange={(e) => setTargetPlayerId(e.target.value)}
              options={[
                { value: '', label: 'Choose a player...' },
                ...players.map((player) => ({ value: player.id, label: player.displayName })),
              ]}
              required
            />
          </div>
        )}

        {/* Related Practice */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Related Practice (Optional)
          </label>
          <Select
            value={relatedPracticeId}
            onChange={(e) => setRelatedPracticeId(e.target.value)}
            options={[
              { value: '', label: 'None' },
              ...practices.map((practice) => ({
                value: practice.id,
                label: `${practice.title} - ${new Date(practice.scheduledDate).toLocaleDateString()}`,
              })),
            ]}
          />
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expires At (Optional)
          </label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Leave empty for no expiration
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Saving...' : announcement ? 'Update' : 'Post Announcement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
