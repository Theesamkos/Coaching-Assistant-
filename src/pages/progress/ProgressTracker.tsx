import { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useNavigate } from 'react-router-dom'

export default function ProgressTracker() {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading progress...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Progress Tracker</h1>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Sessions</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Drills Completed</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Avg Performance</h3>
            <p className="text-3xl font-bold">--</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Improvement</h3>
            <p className="text-3xl font-bold text-green-500">--</p>
          </div>
        </div>

        {/* Progress Chart Placeholder */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
          <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
            <p className="text-gray-400">Chart will appear here once you have activity data</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-400 text-center py-8">No activity data yet. Complete some drills to see your progress!</p>
          </div>
        </div>
      </main>
    </div>
  )
}
