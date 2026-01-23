import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { practiceService } from '@/services/practice.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { Practice } from '@/types'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/solid'

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Practice
}

export default function CalendarPage() {
  const { supabaseUser, userProfile, isCoach } = useAuth()
  const navigate = useNavigate()

  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (userProfile?.id) {
      loadPractices()
    }
  }, [userProfile])

  const loadPractices = async () => {
    if (!userProfile?.id) return

    setLoading(true)
    try {
      const { data } = await practiceService.getPractices(userProfile.id, {})
      setPractices(data || [])
    } catch (error) {
      console.error('Error loading practices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convert practices to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const filteredPractices = statusFilter === 'all' 
      ? practices 
      : practices.filter(p => p.status === statusFilter)

    return filteredPractices.map((practice) => {
      const startDate = new Date(practice.scheduledDate)
      const endDate = new Date(startDate)
      
      if (practice.durationMinutes) {
        endDate.setMinutes(endDate.getMinutes() + practice.durationMinutes)
      } else {
        endDate.setHours(endDate.getHours() + 1) // Default 1 hour
      }

      return {
        id: practice.id,
        title: practice.title,
        start: startDate,
        end: endDate,
        resource: practice,
      }
    })
  }, [practices, statusFilter])

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Navigate to create practice with pre-filled date
    const dateString = format(start, 'yyyy-MM-dd')
    const timeString = format(start, 'HH:mm')
    navigate(`/coach/practices/create?date=${dateString}&time=${timeString}`)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/coach/practices/${event.id}`)
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
  }

  const goToToday = () => {
    setDate(new Date())
  }

  const goToPrevious = () => {
    if (view === 'month') {
      setDate(subMonths(date, 1))
    } else if (view === 'week') {
      setDate(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000))
    } else {
      setDate(new Date(date.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const goToNext = () => {
    if (view === 'month') {
      setDate(addMonths(date, 1))
    } else if (view === 'week') {
      setDate(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else {
      setDate(new Date(date.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const practice = event.resource
    let backgroundColor = '#3b82f6' // blue
    let borderColor = '#2563eb'

    switch (practice.status) {
      case 'scheduled':
        backgroundColor = '#3b82f6' // blue
        borderColor = '#2563eb'
        break
      case 'in_progress':
        backgroundColor = '#10b981' // emerald
        borderColor = '#059669'
        break
      case 'completed':
        backgroundColor = '#6b7280' // slate
        borderColor = '#4b5563'
        break
      case 'cancelled':
        backgroundColor = '#ef4444' // red
        borderColor = '#dc2626'
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '6px',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: '500',
        padding: '4px 8px',
      },
    }
  }

  const handleLogout = async () => {
    navigate('/login')
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Access denied. Coaches only.</div>
      </div>
    )
  }

  return (
    <DashboardLayout
      user={supabaseUser}
      userProfile={userProfile}
      handleLogout={handleLogout}
      role="coach"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <CalendarIcon className="h-8 w-8" />
              Practice Calendar
            </h1>
            <p className="text-slate-400">Visual scheduling and planning</p>
          </div>
          <Button
            onClick={() => navigate('/coach/practices/create')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Practice
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <span className="text-white font-semibold text-lg ml-4">
              {format(date, 'MMMM yyyy')}
            </span>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-2">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg transition-colors font-medium capitalize ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-slate-400 font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600"></div>
            <span className="text-slate-300 text-sm">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-600"></div>
            <span className="text-slate-300 text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-600"></div>
            <span className="text-slate-300 text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600"></div>
            <span className="text-slate-300 text-sm">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-slate-700 overflow-hidden" style={{ height: '700px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-600 text-lg">Loading calendar...</div>
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            selectable
            popup
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            step={30}
            showMultiDayTimes
            toolbar={false}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> Click on any day to quickly create a new practice, or click on an existing practice to view/edit details.
        </p>
      </div>
    </DashboardLayout>
  )
}
