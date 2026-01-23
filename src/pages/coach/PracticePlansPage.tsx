import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { practicePlanService } from '@/services/practice-plan.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FolderOpenIcon,
  StarIcon,
  UsersIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/solid'
import { PracticePlan, PracticePlanCategory, PracticePlanFilters } from '@/types'
import { format } from 'date-fns'

export default function PracticePlansPage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<PracticePlan[]>([])
  const [categories, setCategories] = useState<PracticePlanCategory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<PracticePlanFilters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  useEffect(() => {
    if (userProfile?.id) {
      loadData()
    }
  }, [userProfile, filters])

  const loadData = async () => {
    if (!userProfile?.id) return
    
    setLoading(true)
    try {
      const [plansRes, categoriesRes] = await Promise.all([
        practicePlanService.getPlans(userProfile.id, { ...filters, searchTerm: searchTerm || undefined }),
        practicePlanService.getCategories(userProfile.id),
      ])
      
      if (plansRes.data) setPlans(plansRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading practice plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const handleDuplicate = async (planId: string) => {
    if (!userProfile?.id) return
    
    const { data, error } = await practicePlanService.duplicatePlan(planId, userProfile.id)
    if (error) {
      alert('Failed to duplicate plan')
    } else {
      alert('Plan duplicated successfully!')
      loadData()
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    
    const { error } = await practicePlanService.deletePlan(planId)
    if (error) {
      alert('Failed to delete plan')
    } else {
      loadData()
    }
  }

  const handleToggleFavorite = async (planId: string) => {
    if (!userProfile?.id) return
    
    await practicePlanService.toggleFavorite(planId, userProfile.id)
    loadData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-400">Loading practice plans...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Practice Plans</h1>
            <p className="text-slate-400 mt-1">Reusable templates for creating practices</p>
          </div>
          <Button
            onClick={() => navigate('/coach/plans/create')}
            className="flex items-center gap-2"
          >
            <PlusIcon size={20} />
            Create New Plan
          </Button>
        </div>
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search practice plans..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.categoryId || ''}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={filters.ageGroup || ''}
              onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value as any || undefined })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ages</option>
              <option value="U10">U10</option>
              <option value="U12">U12</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="Adult">Adult</option>
            </select>
            
            <button
              onClick={() => setFilters({ ...filters, isFavorite: !filters.isFavorite })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filters.isFavorite
                  ? 'bg-yellow-600 border-yellow-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <StarIcon size={20} fill={filters.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Total Plans</div>
          <div className="text-2xl font-bold text-white">{plans.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">My Plans</div>
          <div className="text-2xl font-bold text-white">
            {plans.filter(p => p.coachId === userProfile?.id).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Shared with Me</div>
          <div className="text-2xl font-bold text-white">
            {plans.filter(p => p.coachId !== userProfile?.id && !p.isPublic).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Public Plans</div>
          <div className="text-2xl font-bold text-white">
            {plans.filter(p => p.isPublic).length}
          </div>
        </div>
      </div>

      {/* Plans Grid/List */}
      {plans.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
          <FolderOpenIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Practice Plans Yet</h3>
          <p className="text-slate-400 mb-6">
            Create your first practice plan template to get started
          </p>
          <Button onClick={() => navigate('/coach/plans/create')}>
            <PlusIcon size={20} className="mr-2" />
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onView={() => navigate(`/coach/plans/${plan.id}`)}
              onEdit={() => navigate(`/coach/plans/${plan.id}/edit`)}
              onDuplicate={() => handleDuplicate(plan.id)}
              onDelete={() => handleDelete(plan.id)}
              onToggleFavorite={() => handleToggleFavorite(plan.id)}
              isOwner={plan.coachId === userProfile?.id}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

interface PlanCardProps {
  plan: PracticePlan
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  isOwner: boolean
}

function PlanCard({ plan, onView, onEdit, onDuplicate, onDelete, onToggleFavorite, isOwner }: PlanCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all overflow-hidden group">
      {/* Header */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{plan.title}</h3>
            {plan.description && (
              <p className="text-sm text-slate-400 line-clamp-2">{plan.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className="text-slate-400 hover:text-yellow-500 transition-colors"
            >
              <StarIcon size={18} fill={plan.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <EllipsisVerticalIcon size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 py-1 min-w-[150px]">
                  <button onClick={onView} className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2">
                    <EyeIcon size={16} /> View
                  </button>
                  {isOwner && (
                    <button onClick={onEdit} className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2">
                      <PencilIcon size={16} /> Edit
                    </button>
                  )}
                  <button onClick={onDuplicate} className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2">
                    <DocumentDuplicateIcon size={16} /> Duplicate
                  </button>
                  {isOwner && (
                    <>
                      <button onClick={() => {}} className="w-full px-4 py-2 text-left text-white hover:bg-slate-600 flex items-center gap-2">
                        <ShareIcon size={16} /> Share
                      </button>
                      <button onClick={onDelete} className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-600 flex items-center gap-2">
                        <TrashIcon size={16} /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plan.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {plan.tags.length > 3 && (
              <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                +{plan.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {/* Category */}
        {plan.category && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Category:</span>
            <span
              className="px-2 py-1 rounded text-white text-xs font-medium"
              style={{ backgroundColor: plan.category.color || '#6366f1' }}
            >
              {plan.category.name}
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {plan.ageGroup && (
            <div className="flex items-center gap-2 text-slate-400">
              <UsersIcon size={16} />
              <span>{plan.ageGroup}</span>
            </div>
          )}
          {plan.totalDurationMinutes && (
            <div className="flex items-center gap-2 text-slate-400">
              <ClockIcon size={16} />
              <span>{plan.totalDurationMinutes} min</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs text-slate-400">
          <span>Used {plan.timesUsed} times</span>
          <span>Updated {format(new Date(plan.updatedAt), 'MMM d')}</span>
        </div>
      </div>

      {/* Footer Badges */}
      <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700 flex items-center gap-2">
        {plan.isPublic && (
          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
            Public
          </span>
        )}
        {plan.coachId !== plan.coachId && (
          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
            Shared
          </span>
        )}
        {plan.skillLevel && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full capitalize">
            {plan.skillLevel}
          </span>
        )}
      </div>
    </div>
  )
}
