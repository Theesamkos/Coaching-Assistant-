import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { drillService } from '@/services/drill.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DrillModal from '@/components/drills/DrillModal'
import DrillDetailModal from '@/components/drills/DrillDetailModal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Edit,
  Copy,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { Drill } from '@/types'

export default function DrillLibrary() {
  const { userProfile } = useAuth()
  const [drills, setDrills] = useState<Drill[]>([])
  const [filteredDrills, setFilteredDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [favoriteFilter, setFavoriteFilter] = useState(false)

  useEffect(() => {
    if (userProfile?.id) {
      loadDrills()
    }
  }, [userProfile])

  useEffect(() => {
    filterDrills()
  }, [drills, searchTerm, categoryFilter, difficultyFilter, favoriteFilter])

  async function loadDrills() {
    if (!userProfile?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await drillService.getDrills(userProfile.id)
      if (error) {
        console.error('Error loading drills:', error)
      } else {
        setDrills(data || [])
      }
    } catch (error) {
      console.error('Error loading drills:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterDrills() {
    let filtered = [...drills]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (drill) =>
          drill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drill.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((drill) => drill.category === categoryFilter)
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((drill) => drill.difficulty === difficultyFilter)
    }

    // Favorite filter
    if (favoriteFilter) {
      filtered = filtered.filter((drill) => drill.isFavorite)
    }

    setFilteredDrills(filtered)
  }

  async function handleToggleFavorite(drillId: string, currentStatus: boolean) {
    const { data, error } = await drillService.toggleFavorite(drillId, !currentStatus)
    if (!error && data) {
      setDrills(drills.map((d) => (d.id === drillId ? data : d)))
    }
  }

  async function handleDeleteDrill(drillId: string) {
    if (!confirm('Are you sure you want to delete this drill?')) return
    
    const { error } = await drillService.deleteDrill(drillId)
    if (!error) {
      setDrills(drills.filter((d) => d.id !== drillId))
      setIsDetailModalOpen(false)
    }
  }

  async function handleDuplicateDrill(drill: Drill) {
    if (!userProfile?.id) return
    
    const { data, error } = await drillService.createDrill(userProfile.id, {
      title: `${drill.title} (Copy)`,
      description: drill.description,
      category: drill.category,
      durationMinutes: drill.durationMinutes,
      difficulty: drill.difficulty,
      objectives: drill.objectives,
      equipmentNeeded: drill.equipmentNeeded,
      instructions: drill.instructions,
      videoUrl: drill.videoUrl,
      isFavorite: false,
    })
    
    if (!error && data) {
      setDrills([data, ...drills])
    }
  }

  function handleDrillCreated(newDrill: Drill) {
    setDrills([newDrill, ...drills])
    setIsCreateModalOpen(false)
  }

  function handleDrillUpdated(updatedDrill: Drill) {
    setDrills(drills.map((d) => (d.id === updatedDrill.id ? updatedDrill : d)))
    setIsEditModalOpen(false)
    setIsDetailModalOpen(false)
  }

  function openEditModal(drill: Drill) {
    setSelectedDrill(drill)
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  function openDetailModal(drill: Drill) {
    setSelectedDrill(drill)
    setIsDetailModalOpen(true)
  }

  // Get unique categories from drills
  const categories = ['all', ...new Set(drills.map((d) => d.category).filter(Boolean))]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading drills...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Drill Library</h1>
            <p className="text-slate-600">
              {filteredDrills.length} {filteredDrills.length === 1 ? 'drill' : 'drills'}
              {searchTerm || categoryFilter !== 'all' || difficultyFilter !== 'all' || favoriteFilter
                ? ' (filtered)'
                : ''}
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Create Drill
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search drills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categories.map((cat) => ({
              value: cat,
              label: cat === 'all' ? 'All Categories' : cat,
            }))}
            className="md:w-48"
          />

          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Difficulties' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
            className="md:w-48"
          />

          <button
            onClick={() => setFavoriteFilter(!favoriteFilter)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              favoriteFilter
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star size={18} fill={favoriteFilter ? 'currentColor' : 'none'} />
            Favorites
          </button>
        </div>
      </div>

      {/* Drills Grid/List */}
      {filteredDrills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {drills.length === 0 ? 'No drills yet' : 'No drills found'}
          </h3>
          <p className="text-slate-600 mb-4">
            {drills.length === 0
              ? 'Create your first drill to get started!'
              : 'Try adjusting your filters or search term'}
          </p>
          {drills.length === 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 mx-auto">
              <Plus size={20} />
              Create Your First Drill
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredDrills.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              viewMode={viewMode}
              onView={() => openDetailModal(drill)}
              onEdit={() => openEditModal(drill)}
              onDelete={() => handleDeleteDrill(drill.id)}
              onDuplicate={() => handleDuplicateDrill(drill)}
              onToggleFavorite={() => handleToggleFavorite(drill.id, drill.isFavorite)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <DrillModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleDrillCreated}
        />
      )}

      {isEditModalOpen && selectedDrill && (
        <DrillModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleDrillUpdated}
          drill={selectedDrill}
        />
      )}

      {isDetailModalOpen && selectedDrill && (
        <DrillDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          drill={selectedDrill}
          onEdit={() => openEditModal(selectedDrill)}
          onDelete={() => handleDeleteDrill(selectedDrill.id)}
          onDuplicate={() => handleDuplicateDrill(selectedDrill)}
          onToggleFavorite={() => handleToggleFavorite(selectedDrill.id, selectedDrill.isFavorite)}
        />
      )}
    </DashboardLayout>
  )
}

// Drill Card Component
interface DrillCardProps {
  drill: Drill
  viewMode: 'grid' | 'list'
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleFavorite: () => void
}

function DrillCard({
  drill,
  viewMode,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: DrillCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 truncate">{drill.title}</h3>
              {drill.difficulty && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    difficultyColors[drill.difficulty as keyof typeof difficultyColors]
                  }`}
                >
                  {drill.difficulty}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 line-clamp-1">{drill.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              {drill.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {drill.durationMinutes} min
                </span>
              )}
              {drill.category && <span>📁 {drill.category}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Star
                size={18}
                className={drill.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}
              />
            </button>
            <Button variant="secondary" size="sm" onClick={onView}>
              View
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-slate-900 flex-1 pr-2">{drill.title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="flex-shrink-0"
        >
          <Star
            size={20}
            className={drill.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}
          />
        </button>
      </div>

      {drill.difficulty && (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${
            difficultyColors[drill.difficulty as keyof typeof difficultyColors]
          }`}
        >
          {drill.difficulty}
        </span>
      )}

      <p className="text-slate-600 text-sm mb-4 line-clamp-3">{drill.description}</p>

      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
        {drill.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {drill.durationMinutes} min
          </span>
        )}
        {drill.category && <span>📁 {drill.category}</span>}
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex-1 flex items-center justify-center gap-1"
        >
          <Edit size={16} />
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
          className="flex-1 flex items-center justify-center gap-1"
        >
          <Copy size={16} />
          Copy
        </Button>
      </div>
    </div>
  )
}
