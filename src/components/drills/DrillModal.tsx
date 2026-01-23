import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { drillService } from '@/services/drill.service'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { Drill, DrillDifficulty } from '@/types'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'

interface DrillModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (drill: Drill) => void
  drill?: Drill
}

export default function DrillModal({ isOpen, onClose, onSuccess, drill }: DrillModalProps) {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [objectives, setObjectives] = useState<string[]>([])
  const [objectiveInput, setObjectiveInput] = useState('')
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([])
  const [equipmentInput, setEquipmentInput] = useState('')
  const [instructions, setInstructions] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (drill) {
      setTitle(drill.title)
      setDescription(drill.description || '')
      setCategory(drill.category || '')
      setDurationMinutes(drill.durationMinutes?.toString() || '')
      setDifficulty(drill.difficulty || '')
      setObjectives(drill.objectives || [])
      setEquipmentNeeded(drill.equipmentNeeded || [])
      setInstructions(drill.instructions || '')
      setVideoUrl(drill.videoUrl || '')
    } else {
      resetForm()
    }
  }, [drill, isOpen])

  function resetForm() {
    setTitle('')
    setDescription('')
    setCategory('')
    setDurationMinutes('')
    setDifficulty('')
    setObjectives([])
    setObjectiveInput('')
    setEquipmentNeeded([])
    setEquipmentInput('')
    setInstructions('')
    setVideoUrl('')
    setError('')
  }

  function addObjective() {
    if (objectiveInput.trim()) {
      setObjectives([...objectives, objectiveInput.trim()])
      setObjectiveInput('')
    }
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  function addEquipment() {
    if (equipmentInput.trim()) {
      setEquipmentNeeded([...equipmentNeeded, equipmentInput.trim()])
      setEquipmentInput('')
    }
  }

  function removeEquipment(index: number) {
    setEquipmentNeeded(equipmentNeeded.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userProfile?.id) {
      setError('User not authenticated')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const drillData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        difficulty: (difficulty as DrillDifficulty) || undefined,
        objectives: objectives.length > 0 ? objectives : undefined,
        equipmentNeeded: equipmentNeeded.length > 0 ? equipmentNeeded : undefined,
        instructions: instructions.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        isFavorite: drill?.isFavorite || false,
      }

      let result
      if (drill) {
        // Update existing drill
        result = await drillService.updateDrill(drill.id, drillData)
      } else {
        // Create new drill
        result = await drillService.createDrill(userProfile.id, drillData)
      }

      if (result.error) {
        setError(result.error.message)
      } else if (result.data) {
        onSuccess(result.data)
        resetForm()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={drill ? 'Edit Drill' : 'Create New Drill'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <Input
          label="Drill Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Wrist Shot Accuracy"
          required
        />

        {/* Description */}
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this drill involves..."
          rows={3}
        />

        {/* Category and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Shooting, Skating, Passing"
          />

          <Input
            label="Duration (minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="15"
            min="1"
          />
        </div>

        {/* Difficulty */}
        <Select
          label="Difficulty Level"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={[
            { value: '', label: 'Select difficulty...' },
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />

        {/* Objectives */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Objectives
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={objectiveInput}
              onChange={(e) => setObjectiveInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              placeholder="Add an objective..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="button" onClick={addObjective} variant="secondary">
              <PlusIcon size={20} />
            </Button>
          </div>
          {objectives.length > 0 && (
            <div className="space-y-2">
              {objectives.map((obj, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-700">{obj}</span>
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment Needed */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Equipment Needed
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
              placeholder="Add equipment..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="button" onClick={addEquipment} variant="secondary">
              <PlusIcon size={20} />
            </Button>
          </div>
          {equipmentNeeded.length > 0 && (
            <div className="space-y-2">
              {equipmentNeeded.map((equip, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-700">{equip}</span>
                  <button
                    type="button"
                    onClick={() => removeEquipment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <TextArea
          label="Step-by-Step Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="1. Set up cones in a line...&#10;2. Players start at the first cone...&#10;3. ..."
          rows={6}
          helperText="Enter each step on a new line"
        />

        {/* Video URL */}
        <Input
          label="Video URL (optional)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          helperText="Link to a YouTube video or other video URL"
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={loading}>
            {drill ? 'Update Drill' : 'Create Drill'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
