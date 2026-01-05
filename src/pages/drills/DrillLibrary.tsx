import { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useNavigate } from 'react-router-dom'

interface Drill {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  duration_minutes: number
}

export default function DrillLibrary() {
  const [drills, setDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDrills()
  }, [])

  async function loadDrills() {
    try {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrills(data || [])
    } catch (error) {
      console.error('Error loading drills:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading drills...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Drill Library</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-400">{drills.length} drills available</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
            + Create New Drill
          </button>
        </div>

        {/* Drills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drills.map((drill) => (
            <div
              key={drill.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{drill.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  drill.difficulty === 'beginner' ? 'bg-green-600' :
                  drill.difficulty === 'intermediate' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {drill.difficulty}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{drill.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">⏱ {drill.duration_minutes} min</span>
                <span className="text-gray-500">📁 {drill.category}</span>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                View Details
              </button>
            </div>
          ))}
        </div>

        {drills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No drills found. Create your first drill to get started!</p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
              Create Your First Drill
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
