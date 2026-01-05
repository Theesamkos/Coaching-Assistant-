import { useEffect, useState } from 'react'
import { drillService } from '@/services/drill.service'
import type { Drill, DrillCategory, DrillDifficulty } from '@/types/database.types'

export default function DrillLibrary() {
  const [drills, setDrills] = useState<Drill[]>([])
  const [filteredDrills, setFilteredDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<DrillCategory | 'all'>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DrillDifficulty | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories: (DrillCategory | 'all')[] = [
    'all',
    'shooting',
    'skating',
    'stickhandling',
    'passing',
    'defensive',
    'goaltending',
    'conditioning',
    'other',
  ]

  const difficulties: (DrillDifficulty | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced']

  useEffect(() => {
    loadDrills()
  }, [])

  useEffect(() => {
    filterDrills()
  }, [drills, selectedCategory, selectedDifficulty, searchQuery])

  const loadDrills = async () => {
    setLoading(true)
    try {
      const { data } = await drillService.getAllDrills()
      if (data) {
        setDrills(data)
      }
    } catch (error) {
      console.error('Error loading drills:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDrills = () => {
    let filtered = [...drills]

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((drill) => drill.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((drill) => drill.difficulty === selectedDifficulty)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (drill) =>
          drill.title.toLowerCase().includes(query) ||
          drill.description.toLowerCase().includes(query)
      )
    }

    setFilteredDrills(filtered)
  }

  const getDifficultyColor = (difficulty: DrillDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700'
      case 'advanced':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryEmoji = (category: DrillCategory) => {
    const emojiMap: Record<DrillCategory, string> = {
      shooting: '🎯',
      skating: '⛸️',
      stickhandling: '🏒',
      passing: '🎾',
      defensive: '🛡️',
      goaltending: '🥅',
      conditioning: '💪',
      other: '📋',
    }
    return emojiMap[category] || '📋'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading drills...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Drill Library</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Create Custom Drill
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DrillCategory | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as DrillDifficulty | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredDrills.length} of {drills.length} drills
        </p>
      </div>

      {/* Drills Grid */}
      {filteredDrills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No drills found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrills.map((drill) => (
            <div
              key={drill.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryEmoji(drill.category)}</span>
                    <h3 className="font-semibold text-lg">{drill.title}</h3>
                  </div>
                  {drill.is_custom && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{drill.description}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(drill.difficulty)}`}>
                    {drill.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">⏱️ {drill.duration_minutes} min</span>
                </div>

                {/* Equipment */}
                {drill.equipment && drill.equipment.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Equipment:</p>
                    <div className="flex flex-wrap gap-1">
                      {drill.equipment.slice(0, 3).map((item, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {item}
                        </span>
                      ))}
                      {drill.equipment.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{drill.equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
