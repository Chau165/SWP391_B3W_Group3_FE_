// src/pages/Reports.tsx
import { useState, useEffect } from 'react'
import { Calendar, Users, CheckCircle, XCircle, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'

// ==== Kiểu dữ liệu (có thể chỉnh lại cho khớp EventStatsDTO nếu cần) ====
type EventOption = {
  id: number
  title: string
  startTime?: string
  type?: string
}

type Registration = {
  id: number
  userName: string
  studentId?: string | null
  userEmail: string
  seatNumber?: string | null
  registeredAt: string
  checkedIn: boolean
  checkedInAt?: string | null
}

type EventStats = {
  eventId: number
  eventTitle: string
  startTime?: string
  totalTickets: number
  totalCheckedIn: number
  totalRegistrations?: number // nếu DTO không có thì BE có thể set = totalTickets
  eventType?: string
  registrations?: Registration[]
}

export default function Reports() {
  const { user } = useAuth()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const [events, setEvents] = useState<EventOption[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)

  const [selectedStats, setSelectedStats] = useState<EventStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [aggregatedStats, setAggregatedStats] = useState<{
    totalRegistrations: number
    totalCheckedIn: number
    totalNotCheckedIn: number
    eventsCount: number
  } | null>(null)
  const [aggregateLoading, setAggregateLoading] = useState(false)

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // ================== 1. Load danh sách event ==================
  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return
      setEventsLoading(true)
      setEventsError(null)

      try {
        const res = await fetch('/api/events', {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        })

        const data = await res.json()
        console.log('API /events response = ', data)

        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || `HTTP ${res.status}`,
          )
        }

        // ⚠️ BE trả: { openEvents: [...], closedEvents: [...] }
        const rawEvents = [
          ...(data.openEvents ?? []),
          ...(data.closedEvents ?? []),
        ]

        const list: EventOption[] = rawEvents.map((e: any) => ({
          id: e.eventId ?? e.id,
          title: e.title,
          startTime: e.startTime,
          type: e.type || e.category || undefined,
        }))

        setEvents(list)

        // auto chọn event đầu tiên nếu chưa chọn gì
        if (!selectedEventId && list.length > 0) {
          setSelectedEventId(String(list[0].id))
        }
      } catch (err: any) {
        console.error('Fetch events error', err)
        setEventsError(err?.message || 'Không tải được danh sách sự kiện')
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ================== 2. Load thống kê 1 event từ /api/events/stats ==================
  useEffect(() => {
    const fetchStats = async () => {
      if (!token || !selectedEventId) {
        setSelectedStats(null)
        return
      }

      setStatsLoading(true)
      setStatsError(null)

      try {
        const url = `/api/events/stats?eventId=${encodeURIComponent(
          selectedEventId,
        )}`

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || `HTTP ${res.status}`,
          )
        }

        // Map về EventStats (chỉnh field name cho đúng với EventStatsDTO)
        // ✅ API trả totalRegistered thay vì totalRegistrations
        const totalReg = data.totalRegistered ?? data.totalRegistrations ?? data.totalTickets ?? 0
        
        const mapped: EventStats = {
          eventId: data.eventId,
          eventTitle: data.eventTitle || data.title,
          startTime: data.startTime,
          totalTickets: totalReg,
          totalCheckedIn: data.totalCheckedIn ?? 0,
          totalRegistrations: totalReg,
          eventType: data.eventType,
          registrations: data.registrations || [],
        }

        setSelectedStats(mapped)
      } catch (err: any) {
        console.error('Fetch stats error', err)
        setStatsError(err?.message || 'Không tải được thống kê sự kiện')
        setSelectedStats(null)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [token, selectedEventId])

  const selectedEvent = events.find(
    (e) => String(e.id) === String(selectedEventId),
  )

  // ============ Filter events by date range ============
  const filteredEvents = events.filter((event) => {
    if (!dateRange.start && !dateRange.end) return true
    
    if (!event.startTime) return true
    
    const eventDate = new Date(event.startTime)
    
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      if (eventDate < startDate) return false
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      if (eventDate > endDate) return false
    }
    
    return true
  })

  // ============ Aggregate stats for filtered events ============
  const handleFilterAndAggregate = async () => {
    if (!token || filteredEvents.length === 0) return

    setAggregateLoading(true)
    
    try {
      const statsPromises = filteredEvents.map(async (event) => {
        const res = await fetch(`/api/events/stats?eventId=${event.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        })
        
        if (!res.ok) return null
        
        const data = await res.json()
        return {
          totalRegistered: data.totalRegistered ?? data.totalRegistrations ?? 0,
          totalCheckedIn: data.totalCheckedIn ?? 0,
        }
      })

      const statsResults = await Promise.all(statsPromises)
      
      const totals = statsResults.reduce(
        (acc, stat) => {
          if (stat) {
            acc.totalRegistrations += stat.totalRegistered
            acc.totalCheckedIn += stat.totalCheckedIn
          }
          return acc
        },
        { totalRegistrations: 0, totalCheckedIn: 0 }
      )

      setAggregatedStats({
        totalRegistrations: totals.totalRegistrations,
        totalCheckedIn: totals.totalCheckedIn,
        totalNotCheckedIn: totals.totalRegistrations - totals.totalCheckedIn,
        eventsCount: filteredEvents.length,
      })
    } catch (err) {
      console.error('Aggregate stats error:', err)
    } finally {
      setAggregateLoading(false)
    }
  }

  // ============ Data đã map cho UI ============

  const registrations: Registration[] = selectedStats?.registrations || []
  const checkedInCount = selectedStats?.totalCheckedIn ?? 0
  const totalRegistrations =
    selectedStats?.totalRegistrations ?? selectedStats?.totalTickets ?? 0
  const notCheckedInCount =
    totalRegistrations > checkedInCount
      ? totalRegistrations - checkedInCount
      : 0

  const totalEvents = filteredEvents.length
  const totalCheckedIn = checkedInCount

  // Chart data: 1 event đang chọn hoặc tổng hợp
  const eventAttendanceData = aggregatedStats
    ? [
        {
          name: `Tổng hợp (${aggregatedStats.eventsCount} sự kiện)`,
          'Đã đăng ký': aggregatedStats.totalRegistrations,
          'Đã check-in': aggregatedStats.totalCheckedIn,
        },
      ]
    : selectedStats && selectedEvent
    ? [
        {
          name: selectedStats.eventTitle || selectedEvent.title,
          'Đã đăng ký': totalRegistrations,
          'Đã check-in': checkedInCount,
        },
      ]
    : []

  const checkInPieData = aggregatedStats
    ? [
        { name: 'Đã check-in', value: aggregatedStats.totalCheckedIn, color: '#10b981' },
        { name: 'Chưa check-in', value: aggregatedStats.totalNotCheckedIn, color: '#f59e0b' },
      ]
    : [
        { name: 'Đã check-in', value: checkedInCount, color: '#10b981' },
        { name: 'Chưa check-in', value: notCheckedInCount, color: '#f59e0b' },
      ]

  const eventTypeData: Record<string, number> = {}
  if (selectedStats?.eventType) {
    eventTypeData[selectedStats.eventType] = totalRegistrations
  }
  const eventTypeChartData = Object.entries(eventTypeData).map(
    ([name, value]) => ({
      name,
      value,
    }),
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo tham dự</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-5 h-5 mr-2" />
          Xuất báo cáo
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sự kiện</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalEvents}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng đăng ký (sự kiện chọn)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalRegistrations}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng check-in</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCheckedIn}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tỷ lệ check-in</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalRegistrations > 0
                  ? Math.round((totalCheckedIn / totalRegistrations) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Lọc báo cáo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sự kiện
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {eventsLoading && <option>Đang tải...</option>}
              {!eventsLoading && <option value="">-- Tất cả sự kiện trong khoảng thời gian --</option>}
              {filteredEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            {eventsError && (
              <p className="mt-1 text-xs text-red-500">{eventsError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleFilterAndAggregate}
            disabled={aggregateLoading || filteredEvents.length === 0}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Filter className="w-5 h-5 mr-2" />
            {aggregateLoading ? 'Đang tính toán...' : 'Lọc và tính tổng'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Event Attendance Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {aggregatedStats
              ? `Biểu đồ tổng hợp (${aggregatedStats.eventsCount} sự kiện)`
              : 'Thống kê tham dự theo sự kiện (đang chọn)'}
          </h2>
          {statsLoading && !aggregatedStats ? (
            <p className="text-gray-500 text-sm">Đang tải thống kê...</p>
          ) : statsError && !aggregatedStats ? (
            <p className="text-red-500 text-sm">{statsError}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Đã đăng ký" fill="#3b82f6" />
                <Bar dataKey="Đã check-in" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Check-in Status Pie Chart */}
        {(aggregatedStats || (selectedEvent && selectedStats)) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {aggregatedStats
                ? 'Tỷ lệ check-in tổng hợp'
                : `Trạng thái check-in: ${selectedStats?.eventTitle || selectedEvent?.title}`}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={checkInPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {checkInPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Aggregated Results */}
      {aggregatedStats && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              Thống kê tổng hợp ({aggregatedStats.eventsCount} sự kiện)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng đăng ký</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {aggregatedStats.totalRegistrations}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đã check-in</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {aggregatedStats.totalCheckedIn}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chưa check-in</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {aggregatedStats.totalNotCheckedIn}
                    </p>
                  </div>
                  <XCircle className="w-10 h-10 text-orange-500" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Tỷ lệ check-in:{' '}
                <span className="font-bold text-lg text-green-600">
                  {aggregatedStats.totalRegistrations > 0
                    ? Math.round(
                        (aggregatedStats.totalCheckedIn /
                          aggregatedStats.totalRegistrations) *
                          100
                      )
                    : 0}
                  %
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Summary Table  – có thể sau này fetch stats cho tất cả event để fill thêm */}
      {!selectedEvent && !aggregatedStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Hướng dẫn sử dụng</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>Chọn khoảng thời gian:</strong> Sử dụng "Từ ngày" và "Đến ngày" để lọc các sự kiện trong khoảng thời gian cụ thể</p>
            <p>• <strong>Xem tổng hợp:</strong> Nhấn nút "Lọc và tính tổng" để xem thống kê tổng hợp của tất cả sự kiện trong khoảng thời gian</p>
            <p>• <strong>Xem chi tiết:</strong> Chọn 1 sự kiện cụ thể để xem thống kê chi tiết cho sự kiện đó</p>
          </div>
          <p className="mt-4 text-sm text-gray-500 italic">
            Hiện tại: Đang hiển thị {filteredEvents.length} sự kiện
            {(dateRange.start || dateRange.end) && ' trong khoảng thời gian đã chọn'}
          </p>
        </div>
      )}
    </div>
  )
}
