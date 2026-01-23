import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Drill } from '@/types'
import {
  StarIcon,
  ClockIcon,
  TargetIcon,
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
              <ClockIcon size={14} />
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
            <StarIcon size={20} fill={drill.isFavorite ? 'currentColor' : 'none'} />
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
              <TargetIcon size={20} className="text-blue-600" />
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
              <CubeIcon size={20} className="text-purple-600" />
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
              <ListBulletIcon size={20} className="text-green-600" />
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
              <VideoCameraIcon size={20} className="text-red-600" />
              Video Reference
            </h3>
            <a
              href={drill.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <VideoCameraIcon size={16} />
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
            <PencilIcon size={18} />
            Edit Drill
          </Button>
          <Button
            variant="secondary"
            onClick={onDuplicate}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <DocumentDuplicateIcon size={18} />
            Duplicate
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <TrashIcon size={18} />
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
