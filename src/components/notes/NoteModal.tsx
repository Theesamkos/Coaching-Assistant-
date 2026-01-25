import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import { CoachNote, NoteType } from '@/types'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/solid'

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (noteData: {
    noteType: NoteType
    content: string
    tags: string[]
    isVisibleToPlayer: boolean
    isVisibleToTeam: boolean
  }) => Promise<void>
  note?: CoachNote | null
  playerName: string
}

export default function NoteModal({
  isOpen,
  onClose,
  onSave,
  note,
  playerName,
}: NoteModalProps) {
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isVisibleToPlayer, setIsVisibleToPlayer] = useState(false)
  const [isVisibleToTeam, setIsVisibleToTeam] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (note) {
      setNoteType(note.noteType)
      setContent(note.content)
      setTags(note.tags || [])
      setIsVisibleToPlayer(note.isVisibleToPlayer)
      // Note: isVisibleToTeam will come from an extended type later
      setIsVisibleToTeam(false)
    } else {
      resetForm()
    }
  }, [note])

  const resetForm = () => {
    setNoteType('general')
    setContent('')
    setTags([])
    setTagInput('')
    setIsVisibleToPlayer(false)
    setIsVisibleToTeam(false)
    setError('')
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Please enter note content')
      return
    }

    setSaving(true)
    try {
      await onSave({
        noteType,
        content: content.trim(),
        tags,
        isVisibleToPlayer,
        isVisibleToTeam,
      })
      resetForm()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={note ? 'Edit Note' : `Add Note for ${playerName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Note Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Note Type
          </label>
          <Select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
            options={[
              { value: 'general', label: 'General' },
              { value: 'technical', label: 'Technical' },
              { value: 'physical', label: 'Physical' },
              { value: 'mental', label: 'Mental' },
              { value: 'game', label: 'Game' },
            ]}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Note Content *
          </label>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your note..."
            rows={6}
            className="w-full"
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700">Privacy Settings</h3>
          
          {/* Private (default) */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="radio"
              id="privacy-private"
              name="privacy"
              checked={!isVisibleToPlayer && !isVisibleToTeam}
              onChange={() => {
                setIsVisibleToPlayer(false)
                setIsVisibleToTeam(false)
              }}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="privacy-private" className="flex-1">
              <div className="font-medium text-slate-900">🔒 Private (Coach Only)</div>
              <div className="text-sm text-slate-600">
                Only you can see this note
              </div>
            </label>
          </div>

          {/* Visible to Player */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="radio"
              id="privacy-player"
              name="privacy"
              checked={isVisibleToPlayer && !isVisibleToTeam}
              onChange={() => {
                setIsVisibleToPlayer(true)
                setIsVisibleToTeam(false)
              }}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="privacy-player" className="flex-1">
              <div className="font-medium text-slate-900">👤 Share with Player</div>
              <div className="text-sm text-slate-600">
                {playerName} can see this note
              </div>
            </label>
          </div>

          {/* Visible to Team */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="radio"
              id="privacy-team"
              name="privacy"
              checked={isVisibleToTeam}
              onChange={() => {
                setIsVisibleToPlayer(true) // Team visibility implies player visibility
                setIsVisibleToTeam(true)
              }}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="privacy-team" className="flex-1">
              <div className="font-medium text-slate-900">👥 Share with Team</div>
              <div className="text-sm text-slate-600">
                All team members can see this note
              </div>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : note ? 'Update Note' : 'Add Note'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
