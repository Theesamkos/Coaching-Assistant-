import { useState } from 'react'
import { FileShare, FilePermissionLevel } from '../../types'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

interface FileShareDialogProps {
  fileId: string
  existingShares: FileShare[]
  onShare?: (userId: string, permissionLevel: FilePermissionLevel) => void
  onRevokeShare?: (shareId: string) => void
  isLoading?: boolean
  availableUsers?: Array<{ id: string; displayName: string; email: string }>
}

const PERMISSION_LEVELS: { value: FilePermissionLevel; label: string }[] = [
  { value: 'view', label: 'View Only' },
  { value: 'comment', label: 'View & Comment' },
  { value: 'edit', label: 'Edit' },
  { value: 'admin', label: 'Admin' },
]

export default function FileShareDialog({
  fileId,
  existingShares,
  onShare,
  onRevokeShare,
  isLoading = false,
  availableUsers = [],
}: FileShareDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<FilePermissionLevel>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    if (!selectedUserId || !onShare) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onShare(selectedUserId, permissionLevel)
      setSelectedUserId('')
      setPermissionLevel('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share file')
    } finally {
      setIsSubmitting(false)
    }
  }

  const alreadySharedUsers = existingShares.map(s => s.sharedWithUserId)
  const availableUsersToShare = availableUsers.filter(u => !alreadySharedUsers.includes(u.id))

  return (
    <div className="space-y-6">
      {/* Share with new user */}
      {onShare && (
        <div className="border-b border-slate-200 pb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Share with</h3>

          {availableUsers.length === 0 && (
            <div className="text-sm text-slate-500 mb-4">No users available to share with</div>
          )}

          {availableUsers.length > 0 && (
            <div className="space-y-4">
              <Select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                disabled={isSubmitting || availableUsersToShare.length === 0}
              >
                <option value="">Select a user...</option>
                {availableUsersToShare.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </Select>

              <Select
                value={permissionLevel}
                onChange={e => setPermissionLevel(e.target.value as FilePermissionLevel)}
                disabled={isSubmitting}
              >
                {PERMISSION_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                onClick={handleShare}
                disabled={!selectedUserId || isSubmitting || isLoading}
                isLoading={isSubmitting || isLoading}
              >
                Share
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Current shares */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Shared with ({existingShares.length})</h3>

        {existingShares.length === 0 ? (
          <p className="text-sm text-slate-500">Not shared with anyone</p>
        ) : (
          <div className="space-y-2">
            {existingShares.map(share => (
              <ShareItem
                key={share.id}
                share={share}
                onRevoke={onRevokeShare}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ShareItemProps {
  share: FileShare
  onRevoke?: (shareId: string) => void
  isLoading?: boolean
}

function ShareItem({ share, onRevoke, isLoading = false }: ShareItemProps) {
  const [isRevoking, setIsRevoking] = useState(false)

  const handleRevoke = async () => {
    if (!onRevoke) return

    setIsRevoking(true)
    try {
      await onRevoke(share.id)
    } catch (error) {
      console.error('Error revoking share:', error)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900">User {share.sharedWithUserId}</div>
        <div className="text-xs text-slate-500">{share.permissionLevel} access</div>
      </div>

      {onRevoke && (
        <button
          onClick={handleRevoke}
          disabled={isRevoking || isLoading}
          className="ml-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50"
        >
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </button>
      )}
    </div>
  )
}
