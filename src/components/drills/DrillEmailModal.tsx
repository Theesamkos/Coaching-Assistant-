import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { emailService } from '@/services/email.service'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Drill } from '@/types'
import {
  EnvelopeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface DrillEmailModalProps {
  isOpen: boolean
  onClose: () => void
  drill: Drill | null
}

export default function DrillEmailModal({ isOpen, onClose, drill }: DrillEmailModalProps) {
  const { userProfile } = useAuth()
  const [playerEmails, setPlayerEmails] = useState<{ email: string; name?: string }[]>([])
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [customEmail, setCustomEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (isOpen && userProfile?.id) {
      loadPlayerEmails()
    }
  }, [isOpen, userProfile])

  async function loadPlayerEmails() {
    if (!userProfile?.id) return
    setLoading(true)
    const emails = await emailService.getCoachPlayerEmails(userProfile.id)
    setPlayerEmails(emails)
    // Select all by default
    setSelectedEmails(new Set(emails.map((e) => e.email)))
    setLoading(false)
  }

  function toggleEmail(email: string) {
    setSelectedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  function addCustomEmail() {
    if (customEmail.trim() && customEmail.includes('@')) {
      setPlayerEmails((prev) => [...prev, { email: customEmail.trim() }])
      setSelectedEmails((prev) => new Set([...prev, customEmail.trim()]))
      setCustomEmail('')
    }
  }

  function handleSend() {
    if (!drill || selectedEmails.size === 0) return

    const recipients = [...selectedEmails].map((email) => {
      const found = playerEmails.find((p) => p.email === email)
      return { email, name: found?.name }
    })

    emailService.sendDrillEmailViaMailto(recipients, {
      drillTitle: drill.title,
      drillDescription: drill.description,
      drillCategory: drill.category,
      drillDuration: drill.durationMinutes,
      drillDifficulty: drill.difficulty,
      drillObjectives: drill.objectives,
      coachName: userProfile?.displayName || userProfile?.email || 'Coach',
    })

    setSent(true)
    setTimeout(() => {
      setSent(false)
      onClose()
    }, 1500)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Drill to Players">
      <div className="space-y-4">
        {drill && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800">📋 {drill.title}</p>
            {drill.category && <p className="text-xs text-blue-600 mt-0.5">{drill.category}</p>}
          </div>
        )}

        {/* Player email list */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Select Recipients ({selectedEmails.size} selected)
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-2">Loading players...</p>
          ) : playerEmails.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              No players yet. Add emails below.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2">
              {playerEmails.map((p) => (
                <label
                  key={p.email}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(p.email)}
                    onChange={() => toggleEmail(p.email)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-slate-700">
                    {p.name ? `${p.name} (${p.email})` : p.email}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Add custom email */}
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Add email manually:</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomEmail()}
              placeholder="player@email.com"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCustomEmail}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        {sent && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Email client opened!</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Skip
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedEmails.size === 0 || sent}
            className="flex-1"
          >
            <span className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4" />
              Send to {selectedEmails.size} Player{selectedEmails.size !== 1 ? 's' : ''}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
