import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User, UserRole } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: SupabaseUser | null
  userProfile?: User | null
  handleLogout?: () => void
  role?: UserRole
}

export default function DashboardLayout({ 
  children,
  user,
  userProfile,
  handleLogout,
  role 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-4 bg-slate-800 border-b border-slate-700 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-white">Coaching Assistant</h1>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

