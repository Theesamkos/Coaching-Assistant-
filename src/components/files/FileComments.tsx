import { useState } from 'react'
import { FileComment } from '../../types'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'

interface FileCommentsProps {
  fileId: string
  comments: FileComment[]
  onAddComment?: (comment: string, timestampPosition?: number) => void
  onDeleteComment?: (commentId: string) => void
  isLoading?: boolean
  isVideo?: boolean
  currentTime?: number
}

export default function FileComments({
  fileId,
  comments,
  onAddComment,
  onDeleteComment,
  isLoading = false,
  isVideo = false,
  currentTime = 0,
}: FileCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [showAddComment, setShowAddComment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return

    setIsSubmitting(true)
    try {
      const timestamp = isVideo ? currentTime : undefined
      await onAddComment(newComment, timestamp)
      setNewComment('')
      setShowAddComment(false)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-slate-900 mb-4">Comments ({comments.length})</h3>

      {/* Add Comment Section */}
      {onAddComment && (
        <div className="mb-6">
          {!showAddComment ? (
            <button
              onClick={() => setShowAddComment(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add comment
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <TextArea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                disabled={isSubmitting}
              />

              {isVideo && (
                <div className="text-xs text-slate-500">Timestamp: {formatTime(currentTime)}</div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddComment(false)
                    setNewComment('')
                  }}
                  className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={onDeleteComment}
              isVideo={isVideo}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: FileComment
  onDelete?: (commentId: string) => void
  isVideo?: boolean
}

function CommentItem({ comment, onDelete, isVideo }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isVideo && comment.timestampPosition !== undefined && (
            <div className="text-xs text-blue-600 font-medium mb-1">
              @ {formatTime(comment.timestampPosition)}
            </div>
          )}
          <p className="text-sm text-slate-900">{comment.comment}</p>
          <p className="text-xs text-slate-500 mt-2">
            {new Date(comment.createdAt).toLocaleDateString()}{' '}
            {new Date(comment.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-2 text-slate-400 hover:text-red-600 text-sm disabled:opacity-50"
            title="Delete comment"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`
}
