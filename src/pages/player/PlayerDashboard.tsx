import { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useNavigate } from 'react-router-dom'

export default function PlayerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Player Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Upcoming Sessions</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Completed Drills</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Progress Score</h3>
            <p className="text-3xl font-bold">--</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome to Your Training Portal! 🏀</h2>
          <p className="text-gray-100">Track your progress, complete drills, and improve your skills with personalized coaching.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/progress')}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition border border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2">📊 My Progress</h3>
            <p className="text-gray-400">View your performance stats and improvement</p>
          </button>
          <button
            onClick={() => navigate('/drills')}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition border border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2">📚 Practice Drills</h3>
            <p className="text-gray-400">Access your assigned drills and exercises</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-400 text-center py-8">No recent activity. Start practicing to see your progress here!</p>
          </div>
        </div>
      </main>
    </div>
  )
}
