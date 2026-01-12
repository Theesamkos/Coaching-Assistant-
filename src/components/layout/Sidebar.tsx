import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Library,
  FolderOpen,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  roles: ('coach' | 'player')[]
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['coach', 'player'] },
  { name: 'Players', path: '/coach/players', icon: Users, roles: ['coach'] },
  { name: 'My Coaches', path: '/player/coaches', icon: Users, roles: ['player'] },
  { name: 'Drills', path: '/drills', icon: BookOpen, roles: ['coach', 'player'] },
  { name: 'Practices', path: '/coach/practices', icon: Calendar, roles: ['coach'] },
  { name: 'Practice Plans', path: '/coach/plans', icon: ClipboardList, roles: ['coach'] },
  { name: 'Library', path: '/library', icon: Library, roles: ['coach', 'player'] },
  { name: 'Files', path: '/files', icon: FolderOpen, roles: ['coach', 'player'] },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { userProfile, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter((item) =>
    userProfile?.role ? item.roles.includes(userProfile.role) : false
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CA</span>
                </div>
                <span className="text-white font-semibold text-lg">Coaching Assistant</span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X size={24} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block text-slate-400 hover:text-white p-1"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* AI Agent Section */}
          <div className="border-t border-slate-800 p-3">
            <Link
              to="/ai-assistant"
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'AI Assistant' : undefined}
            >
              <MessageSquare size={20} />
              {!isCollapsed && <span className="font-medium">AI Assistant</span>}
            </Link>
          </div>

          {/* User Section */}
          <div className="border-t border-slate-800 p-3">
            <div
              className={`
                flex items-center gap-3 px-3 py-2 text-slate-400
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {userProfile?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              )}
              {isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

