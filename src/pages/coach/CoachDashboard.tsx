import { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useNavigate } from 'react-router-dom'

interface Player {
  id: string
  full_name: string
  email: string
  created_at: string
}

export default function CoachDashboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: playersData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlayers(playersData || [])
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
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, Coach {user?.email}</span>
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
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Players</h3>
            <p className="text-3xl font-bold">{players.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Active Sessions</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Drills Created</h3>
            <p className="text-3xl font-bold">5</p>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Players</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
              + Add Player
            </button>
          </div>
          <div className="p-6">
            {players.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No players yet. Add your first player to get started!</p>
            ) : (
              <div className="space-y-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-700 rounded-lg p-4 flex justify-between items-center hover:bg-gray-600 transition"
                  >
                    <div>
                      <h3 className="font-semibold">{player.full_name}</h3>
                      <p className="text-sm text-gray-400">{player.email}</p>
                    </div>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition text-sm">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/drills')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg p-6 text-left transition"
          >
            <h3 className="text-xl font-semibold mb-2">📚 Drill Library</h3>
            <p className="text-gray-200">Create and manage practice drills</p>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg p-6 text-left transition"
          >
            <h3 className="text-xl font-semibold mb-2">📊 Progress Tracking</h3>
            <p className="text-gray-200">View player performance and analytics</p>
          </button>
        </div>
      </main>
    </div>
  )
}
