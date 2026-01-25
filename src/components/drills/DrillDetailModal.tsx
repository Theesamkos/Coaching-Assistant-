import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Drill } from '@/types'
import {
  StarIcon,
  ClockIcon,
  FlagIcon,
  CubeIcon,
  ListBulletIcon,
  VideoCameraIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'

interface DrillDetailModalProps {
  isOpen: boolean
  onClose: () => void
  drill: Drill
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleFavorite: () => void
}

export default function DrillDetailModal({
  isOpen,
  onClose,
  drill,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: DrillDetailModalProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700 border-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    advanced: 'bg-red-100 text-red-700 border-red-300',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={drill.title} size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-wrap items-center gap-3">
          {drill.difficulty && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                difficultyColors[drill.difficulty as keyof typeof difficultyColors]
              }`}
            >
              {drill.difficulty.charAt(0).toUpperCase() + drill.difficulty.slice(1)}
            </span>
          )}
          
          {drill.category && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-300">
              📁 {drill.category}
            </span>
          )}
          
          {drill.durationMinutes && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-300">
              <ClockIcon className="h-3.5 w-3.5" />
              {drill.durationMinutes} minutes
            </span>
          )}

          <button
            onClick={onToggleFavorite}
            className={`ml-auto p-2 rounded-lg transition-colors ${
              drill.isFavorite
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <StarIcon className="h-5 w-5" fill={drill.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Description */}
        {drill.description && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 leading-relaxed">{drill.description}</p>
          </div>
        )}

        {/* Objectives */}
        {drill.objectives && drill.objectives.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FlagIcon className="h-5 w-5 text-blue-600" />
              Objectives
            </h3>
            <ul className="space-y-2">
              {drill.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Equipment Needed */}
        {drill.equipmentNeeded && drill.equipmentNeeded.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CubeIcon className="h-5 w-5 text-purple-600" />
              Equipment Needed
            </h3>
            <div className="flex flex-wrap gap-2">
              {drill.equipmentNeeded.map((equipment, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                >
                  {equipment}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {drill.instructions && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <ListBulletIcon className="h-5 w-5 text-green-600" />
              Instructions
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <pre className="whitespace-pre-wrap text-slate-700 font-sans text-sm leading-relaxed">
                {drill.instructions}
              </pre>
            </div>
          </div>
        )}

        {/* Video */}
        {drill.videoUrl && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <VideoCameraIcon className="h-5 w-5 text-red-600" />
              Video Reference
            </h3>
            <a
              href={drill.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <VideoCameraIcon className="h-4 w-4" />
              Watch Video
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <PencilIcon className="h-\[18px\] w-\[18px\]" />
            Edit Drill
          </Button>
          <Button
            variant="secondary"
            onClick={onDuplicate}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <DocumentDuplicateIcon className="h-\[18px\] w-\[18px\]" />
            Duplicate
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <TrashIcon className="h-\[18px\] w-\[18px\]" />
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
