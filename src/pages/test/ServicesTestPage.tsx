import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { playerManagementService } from '@/services/player-management.service'
import { teamService } from '@/services/team.service'
import { noteService } from '@/services/note.service'
import { statisticsService } from '@/services/statistics.service'

/**
 * ServicesTestPage - Internal testing page for validating services
 * 
 * This page tests all new services to ensure they work correctly with the database.
 * Only accessible to authenticated users (coaches).
 * 
 * **REMOVE THIS PAGE IN PRODUCTION**
 */
export default function ServicesTestPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runAllTests = async () => {
    if (!supabaseUser || !userProfile || !isCoach) {
      addResult('❌ ERROR: Must be logged in as a coach to run tests')
      return
    }

    setIsRunning(true)
    setTestResults([])
    addResult('🚀 Starting service tests...')
    addResult(`📝 User: ${userProfile.displayName} (${userProfile.id})`)
    addResult('---')

    try {
      // Test 1: Player Management Service
      addResult('📋 Test 1: Get Coach Players')
      const { data: players, error: playersError } = await playerManagementService.getCoachPlayersEnhanced(
        userProfile.id
      )
      if (playersError) {
        addResult(`❌ Error: ${playersError.message}`)
      } else {
        addResult(`✅ Success: Found ${players?.length || 0} players`)
      }

      // Test 2: Team Service
      addResult('---')
      addResult('📋 Test 2: Get Coach Teams')
      const { data: teams, error: teamsError } = await teamService.getCoachTeams(userProfile.id)
      if (teamsError) {
        addResult(`❌ Error: ${teamsError.message}`)
      } else {
        addResult(`✅ Success: Found ${teams?.length || 0} teams`)
      }

      // Test 3: Team Creation
      addResult('---')
      addResult('📋 Test 3: Create Test Team')
      const { data: newTeam, error: createTeamError } = await teamService.createTeam(
        userProfile.id,
        {
          name: `Test Team ${Date.now()}`,
          description: 'Automated test team',
          season: '2025-2026',
        }
      )
      if (createTeamError) {
        addResult(`❌ Error: ${createTeamError.message}`)
      } else {
        addResult(`✅ Success: Created team "${newTeam?.name}" (ID: ${newTeam?.id})`)

        // Test 3b: Delete the test team
        if (newTeam?.id) {
          const { error: deleteError } = await teamService.deleteTeam(newTeam.id)
          if (deleteError) {
            addResult(`⚠️ Warning: Could not delete test team: ${deleteError.message}`)
          } else {
            addResult(`✅ Cleanup: Deleted test team`)
          }
        }
      }

      // Test 4: Note Service
      addResult('---')
      addResult('📋 Test 4: Get Coach Notes')
      const { data: notes, error: notesError } = await noteService.getCoachNotes(userProfile.id)
      if (notesError) {
        addResult(`❌ Error: ${notesError.message}`)
      } else {
        addResult(`✅ Success: Found ${notes?.length || 0} notes`)
      }

      // Test 5: Get Coach Tags
      addResult('---')
      addResult('📋 Test 5: Get Coach Tags')
      const { data: tags, error: tagsError } = await noteService.getCoachTags(userProfile.id)
      if (tagsError) {
        addResult(`❌ Error: ${tagsError.message}`)
      } else {
        addResult(`✅ Success: Found ${tags?.length || 0} unique tags: ${tags?.join(', ') || 'none'}`)
      }

      // Test 6: Statistics Service
      addResult('---')
      addResult('📋 Test 6: Get Coach Statistics')
      const { data: stats, error: statsError } = await statisticsService.getCoachStatistics(
        userProfile.id
      )
      if (statsError) {
        addResult(`❌ Error: ${statsError.message}`)
      } else {
        addResult(`✅ Success: Found ${stats?.length || 0} statistic entries`)
      }

      // Test 7: Privacy Settings (if there's a player)
      if (players && players.length > 0) {
        addResult('---')
        addResult('📋 Test 7: Get Player Profile with Privacy')
        const testPlayer = players[0]
        const { data: playerProfile, error: profileError } =
          await playerManagementService.getPlayerProfile(testPlayer.id)
        if (profileError) {
          addResult(`❌ Error: ${profileError.message}`)
        } else {
          addResult(
            `✅ Success: Got profile for ${playerProfile?.displayName}`
          )
          addResult(
            `   Privacy: ${JSON.stringify(playerProfile?.privacySettings).substring(0, 100)}...`
          )
        }
      }

      addResult('---')
      addResult('🎉 All tests completed!')
    } catch (error: any) {
      addResult(`❌ FATAL ERROR: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  if (!supabaseUser || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to access test page</div>
      </div>
    )
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">This page is only accessible to coaches</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Services Test Page</h1>
          <p className="text-slate-300 mb-4">
            This page tests all player management services to ensure they work correctly.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-200 text-sm">
              <strong>⚠️ Internal Testing Only:</strong> Remove this page before production
              deployment.
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              isRunning
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isRunning ? '⏳ Running Tests...' : '▶️ Run All Tests'}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Test Results</h2>
              <button
                onClick={() => setTestResults([])}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Data Info */}
        <div className="bg-slate-800 rounded-xl p-6 mt-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">📊 Current Data</h2>
          <div className="space-y-2 text-slate-300">
            <p>
              <strong>Logged in as:</strong> {userProfile.displayName} ({userProfile.role})
            </p>
            <p>
              <strong>User ID:</strong> {userProfile.id}
            </p>
            <p>
              <strong>Email:</strong> {supabaseUser.email}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-800 rounded-xl p-6 mt-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">🔗 Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/coach/dashboard"
              className="block p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-center transition-colors"
            >
              ← Back to Dashboard
            </a>
            <a
              href="/coach/players"
              className="block p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-center transition-colors"
            >
              View Players →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

