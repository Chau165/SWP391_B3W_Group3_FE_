// src/pages/Reports.tsx

// Import hook React để quản lý state + side-effect
import { useState, useEffect } from 'react'

// Import icon từ lucide-react để hiển thị UI dashboard báo cáo
import { Calendar, Users, CheckCircle, XCircle, Download, Filter } from 'lucide-react'

// Import format ngày giờ từ date-fns để hiển thị đẹp (VN)
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Import các component chart từ recharts để vẽ biểu đồ cột + pie
import {
  BarChart,            // Biểu đồ cột
  Bar,                 // Cột
  XAxis,               // Trục X
  YAxis,               // Trục Y
  CartesianGrid,       // Lưới nền
  Tooltip,             // Tooltip khi hover
  Legend,              // Chú thích
  ResponsiveContainer, // Tự co giãn theo container
  PieChart,            // Biểu đồ tròn
  Pie,                 // Miếng bánh
  Cell,                // Tô màu từng miếng
} from 'recharts'

// Import AuthContext để lấy user (phân quyền, hiển thị theo role...)
import { useAuth } from '../contexts/AuthContext'

// ==== Kiểu dữ liệu (có thể chỉnh lại cho khớp EventStatsDTO nếu cần) ====

// EventOption: dữ liệu tối giản của event dùng cho dropdown chọn sự kiện
type EventOption = {
  id: number
  title: string
  startTime?: string
  type?: string
}

// Registration: dữ liệu từng người đăng ký (dùng nếu muốn hiển thị danh sách chi tiết)
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

// EventStats: dữ liệu thống kê của 1 event (hoặc để tổng hợp)
// Chứa tổng đăng ký, check-in, check-out + danh sách registrations (nếu có)
type EventStats = {
  eventId: number
  eventTitle: string
  startTime?: string
  totalTickets: number
  totalCheckedIn: number
  totalCheckedOut: number
  totalRegistrations?: number // nếu DTO không có thì BE có thể set = totalTickets
  checkInRate?: string
  checkOutRate?: string
  eventType?: string
  registrations?: Registration[]
}

export default function Reports() {
  // Lấy user từ AuthContext (có thể dùng để kiểm tra quyền staff/admin)
  const { user } = useAuth()

  // selectedEventId: event đang chọn trong dropdown (string vì lấy từ <select>)
  const [selectedEventId, setSelectedEventId] = useState<string>('')

  // dateRange: khoảng thời gian filter event (start/end dạng yyyy-mm-dd)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // events: danh sách sự kiện để chọn
  const [events, setEvents] = useState<EventOption[]>([])

  // eventsLoading/eventsError: trạng thái loading/error khi fetch events
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)

  // selectedStats: thống kê chi tiết của 1 event đang chọn
  const [selectedStats, setSelectedStats] = useState<EventStats | null>(null)

  // statsLoading/statsError: trạng thái loading/error khi fetch stats của 1 event
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  /**
   * aggregatedStats: thống kê tổng hợp nhiều sự kiện (sau khi user lọc theo dateRange
   * và bấm "Lọc và tính tổng")
   *
   * totalNotCheckedIn: tổng đăng ký - tổng check-in
   * eventsCount: số sự kiện được tổng hợp
   */
  const [aggregatedStats, setAggregatedStats] = useState<{
    totalRegistrations: number
    totalCheckedIn: number
    totalCheckedOut: number
    totalNotCheckedIn: number
    eventsCount: number
  } | null>(null)

  // aggregateLoading: trạng thái loading khi đang tổng hợp (gọi stats nhiều event)
  const [aggregateLoading, setAggregateLoading] = useState(false)

  /**
   * token: JWT từ localStorage để gọi API có Authorization Bearer
   * typeof window !== 'undefined' để tránh lỗi nếu SSR
   */
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // ================== 1. Load danh sách event ==================
  useEffect(() => {
    // fetchEvents: gọi API /api/events để lấy danh sách event (open + closed)
    const fetchEvents = async () => {
      // Nếu chưa có token thì không gọi API
      if (!token) return

      // Bật loading và reset error
      setEventsLoading(true)
      setEventsError(null)

      try {
        // Gọi API lấy danh sách event
        const res = await fetch('/api/events', {
          headers: {
            Authorization: `Bearer ${token}`,
            // Header này thường dùng khi dùng ngrok để bỏ warning (không bắt buộc)
            'ngrok-skip-browser-warning': '1',
          },
          // credentials include nếu BE dùng cookie kèm theo
          credentials: 'include',
        })

        // Parse JSON
        const data = await res.json()
        console.log('API /events response = ', data)

        // Nếu res không OK -> throw error để catch xử lý
        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || `HTTP ${res.status}`,
          )
        }

        /**
         * ⚠️ Theo comment: BE trả về dạng:
         * { openEvents: [...], closedEvents: [...] }
         *
         * => gộp 2 mảng lại thành 1 list duy nhất để render dropdown
         */
        const rawEvents = [
          ...(data.openEvents ?? []),
          ...(data.closedEvents ?? []),
        ]

        /**
         * Map dữ liệu event từ BE về EventOption cho FE dùng:
         * - id có thể là eventId hoặc id
         * - type có thể là type hoặc category
         */
        const list: EventOption[] = rawEvents.map((e: any) => ({
          id: e.eventId ?? e.id,
          title: e.title,
          startTime: e.startTime,
          type: e.type || e.category || undefined,
        }))

        // Set state events để UI dropdown render
        setEvents(list)

        // Auto chọn event đầu tiên nếu chưa chọn gì (UX tốt hơn)
        if (!selectedEventId && list.length > 0) {
          setSelectedEventId(String(list[0].id))
        }
      } catch (err: any) {
        // Nếu lỗi API/network -> set error để hiển thị UI
        console.error('Fetch events error', err)
        setEventsError(err?.message || 'Không tải được danh sách sự kiện')
      } finally {
        // Tắt loading
        setEventsLoading(false)
      }
    }

    // Gọi fetchEvents khi token thay đổi
    fetchEvents()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // (Bạn đang cố tình không đưa selectedEventId vào deps để tránh auto chạy lại)
  }, [token])

  // ================== 2. Load thống kê 1 event từ /api/events/stats ==================
  useEffect(() => {
    const fetchStats = async () => {
      // Nếu chưa có token hoặc chưa chọn event -> reset selectedStats và return
      if (!token || !selectedEventId) {
        setSelectedStats(null)
        return
      }

      // Bật loading và reset error
      setStatsLoading(true)
      setStatsError(null)

      try {
        // Tạo URL gọi API stats theo eventId
        const url = `/api/events/stats?eventId=${encodeURIComponent(
          selectedEventId,
        )}`

        // Fetch thống kê event
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        })

        // Parse JSON
        const data = await res.json()

        // Nếu res không OK -> throw error
        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || `HTTP ${res.status}`,
          )
        }

        /**
         * Map về EventStats:
         * - Bạn có comment: API trả totalRegistered thay vì totalRegistrations
         * -> totalReg sẽ ưu tiên totalRegistered, fallback totalRegistrations, fallback totalTickets
         */
        const totalReg =
          data.totalRegistered ?? data.totalRegistrations ?? data.totalTickets ?? 0

        // mapped: chuẩn hóa field name để UI dùng thống nhất
        const mapped: EventStats = {
          eventId: data.eventId,
          eventTitle: data.eventTitle || data.title,
          startTime: data.startTime,
          totalTickets: totalReg, // ở đây bạn dùng totalTickets = totalReg cho thống nhất
          totalCheckedIn: data.totalCheckedIn ?? 0,
          totalCheckedOut: data.totalCheckedOut ?? 0,
          totalRegistrations: totalReg,
          checkInRate: data.checkInRate,
          checkOutRate: data.checkOutRate,
          eventType: data.eventType,
          registrations: data.registrations || [],
        }

        // Set state thống kê event đang chọn
        setSelectedStats(mapped)
      } catch (err: any) {
        // Nếu lỗi -> set error và reset selectedStats
        console.error('Fetch stats error', err)
        setStatsError(err?.message || 'Không tải được thống kê sự kiện')
        setSelectedStats(null)
      } finally {
        // Tắt loading
        setStatsLoading(false)
      }
    }

    // chạy fetchStats mỗi khi token hoặc selectedEventId thay đổi
    fetchStats()
  }, [token, selectedEventId])

  /**
   * selectedEvent: object event đang chọn, lấy từ danh sách events
   * dùng để hiển thị title fallback nếu selectedStats thiếu eventTitle
   */
  const selectedEvent = events.find(
    (e) => String(e.id) === String(selectedEventId),
  )

  // ============ Filter events by date range ============
  /**
   * filteredEvents:
   * - Lọc danh sách events theo dateRange.start và dateRange.end
   * - Nếu user chưa chọn ngày => trả về toàn bộ events
   */
  const filteredEvents = events.filter((event) => {
    // Nếu không chọn start/end -> không lọc
    if (!dateRange.start && !dateRange.end) return true

    // Nếu event không có startTime thì cho qua (để không bị mất event)
    if (!event.startTime) return true

    // Parse startTime của event
    const eventDate = new Date(event.startTime)

    // Nếu có start date -> loại các event trước start
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      if (eventDate < startDate) return false
    }

    // Nếu có end date -> loại các event sau end (đặt cuối ngày 23:59:59)
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      if (eventDate > endDate) return false
    }

    return true
  })

  // ============ Aggregate stats for filtered events ============
  /**
   * handleFilterAndAggregate:
   * - Khi user bấm nút "Lọc và tính tổng"
   * - Sẽ gọi API /api/events/stats cho TẤT CẢ filteredEvents
   * - Promise.all để chạy song song
   * - Sau đó cộng dồn totals và setAggregatedStats để UI hiển thị "tổng hợp"
   */
  const handleFilterAndAggregate = async () => {
    // Nếu thiếu token hoặc không có event nào sau khi lọc -> không làm gì
    if (!token || filteredEvents.length === 0) return

    // Bật loading tổng hợp
    setAggregateLoading(true)

    try {
      // Tạo mảng promise: mỗi event gọi stats 1 lần
      const statsPromises = filteredEvents.map(async (event) => {
        const res = await fetch(`/api/events/stats?eventId=${event.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        })

        // Nếu event nào lỗi thì bỏ qua (return null)
        if (!res.ok) return null

        const data = await res.json()

        // Chuẩn hóa field tổng đăng ký/checkin/checkout để cộng dồn
        return {
          totalRegistered: data.totalRegistered ?? data.totalRegistrations ?? 0,
          totalCheckedIn: data.totalCheckedIn ?? 0,
          totalCheckedOut: data.totalCheckedOut ?? 0,
        }
      })

      // Chạy tất cả promise song song
      const statsResults = await Promise.all(statsPromises)

      // Reduce để cộng dồn tổng các event
      const totals = statsResults.reduce(
        (acc, stat) => {
          if (stat) {
            acc.totalRegistrations += stat.totalRegistered
            acc.totalCheckedIn += stat.totalCheckedIn
            acc.totalCheckedOut += stat.totalCheckedOut
          }
          return acc
        },
        { totalRegistrations: 0, totalCheckedIn: 0, totalCheckedOut: 0 }
      )

      // Set aggregatedStats cho UI:
      // totalNotCheckedIn = totalRegistrations - totalCheckedIn
      setAggregatedStats({
        totalRegistrations: totals.totalRegistrations,
        totalCheckedIn: totals.totalCheckedIn,
        totalCheckedOut: totals.totalCheckedOut,
        totalNotCheckedIn: totals.totalRegistrations - totals.totalCheckedIn,
        eventsCount: filteredEvents.length,
      })
    } catch (err) {
      // Lỗi tổng hợp (network)
      console.error('Aggregate stats error:', err)
    } finally {
      // Tắt loading tổng hợp
      setAggregateLoading(false)
    }
  }

  // ============ Data đã map cho UI ============

  // registrations: danh sách người đăng ký của event đang chọn (nếu API trả)
  const registrations: Registration[] = selectedStats?.registrations || []

  // count checkin/checkout/registrations từ selectedStats (fallback về 0)
  const checkedInCount = selectedStats?.totalCheckedIn ?? 0
  const checkedOutCount = selectedStats?.totalCheckedOut ?? 0

  // totalRegistrations: ưu tiên totalRegistrations -> fallback totalTickets -> fallback 0
  const totalRegistrations =
    selectedStats?.totalRegistrations ?? selectedStats?.totalTickets ?? 0

  // notCheckedInCount: số người chưa check-in = đăng ký - checkin (không âm)
  const notCheckedInCount =
    totalRegistrations > checkedInCount
      ? totalRegistrations - checkedInCount
      : 0

  /**
   * totalEvents: số sự kiện trong filteredEvents (tùy dateRange)
   * totalCheckedIn/Out: hiện đang dùng số của event đang chọn
   * (nếu muốn tổng checkin/out cho filtered events thì lấy từ aggregatedStats)
   */
  const totalEvents = filteredEvents.length
  const totalCheckedIn = checkedInCount
  const totalCheckedOut = checkedOutCount

  // Chart data: 1 event đang chọn hoặc tổng hợp (nếu aggregatedStats có)
  const eventAttendanceData = aggregatedStats
    ? [
        {
          // Khi tổng hợp: đặt tên là "Tổng hợp (n sự kiện)"
          name: `Tổng hợp (${aggregatedStats.eventsCount} sự kiện)`,
          'Đã đăng ký': aggregatedStats.totalRegistrations,
          'Đã check-in': aggregatedStats.totalCheckedIn,
          'Đã check-out': aggregatedStats.totalCheckedOut,
        },
      ]
    : selectedStats && selectedEvent
    ? [
        {
          // Khi xem chi tiết 1 event: đặt name theo eventTitle
          name: selectedStats.eventTitle || selectedEvent.title,
          'Đã đăng ký': totalRegistrations,
          'Đã check-in': checkedInCount,
          'Đã check-out': checkedOutCount,
        },
      ]
    : []

  /**
   * Dữ liệu pie chart:
   * - Nếu đang tổng hợp: dùng aggregatedStats
   * - Nếu xem chi tiết: dùng checkedIn/Out/notCheckedInCount
   *
   * Lưu ý: entry.color đang dùng hex để tô màu từng phần
   */
  const checkInPieData = aggregatedStats
    ? [
        { name: 'Đã check-in', value: aggregatedStats.totalCheckedIn, color: '#10b981' },
        { name: 'Đã check-out', value: aggregatedStats.totalCheckedOut, color: '#8b5cf6' },
        { name: 'Chưa check-in', value: aggregatedStats.totalNotCheckedIn, color: '#f59e0b' },
      ]
    : [
        { name: 'Đã check-in', value: checkedInCount, color: '#10b981' },
        { name: 'Đã check-out', value: checkedOutCount, color: '#8b5cf6' },
        { name: 'Chưa check-in', value: notCheckedInCount, color: '#f59e0b' },
      ]

  /**
   * eventTypeChartData:
   * - Bạn đang tạo object eventTypeData chỉ cho 1 eventType
   * - rồi map thành dạng array để chart (nhưng hiện code chưa render chart type)
   */
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

  // ===================== RENDER UI =====================
  return (
    <div>
      {/* Header trang + nút export */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo tham dự</h1>

        {/* Nút xuất báo cáo - hiện tại chỉ UI, chưa gắn handler */}
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-5 h-5 mr-2" />
          Xuất báo cáo
        </button>
      </div>

      {/* ===================== Overall Statistics ===================== */}
      {/* 4 ô thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Tổng sự kiện (số event sau khi filter dateRange) */}
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

        {/* Tổng đăng ký (sự kiện chọn) - hiện đang hiển thị theo selectedStats */}
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

        {/* Tổng check-in (sự kiện chọn) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng check-in</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCheckedIn}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Tổng check-out (sự kiện chọn) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng check-out</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCheckedOut}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* ===================== Check-in/Check-out Rate Cards ===================== */}
      {/* 2 ô hiển thị tỷ lệ check-in và check-out */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tỷ lệ check-in */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tỷ lệ check-in</p>

              {/* Ưu tiên lấy checkInRate từ BE, nếu không có thì tự tính */}
              <p className="text-3xl font-bold text-green-600 mt-2">
                {selectedStats?.checkInRate || (totalRegistrations > 0
                  ? Math.round((totalCheckedIn / totalRegistrations) * 100) + '%'
                  : '0%')}
              </p>
            </div>

            {/* Icon circle */}
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
              <span className="text-2xl text-green-600">✓</span>
            </div>
          </div>
        </div>

        {/* Tỷ lệ check-out */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tỷ lệ check-out</p>

              {/* Ưu tiên lấy checkOutRate từ BE, nếu không có thì tự tính */}
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {selectedStats?.checkOutRate || (totalCheckedIn > 0
                  ? Math.round((totalCheckedOut / totalCheckedIn) * 100) + '%'
                  : '0%')}
              </p>
            </div>

            {/* Icon circle */}
            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full">
              <span className="text-2xl text-purple-600">↩</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== Filters ===================== */}
      {/* Khối filter theo event + theo khoảng thời gian */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Lọc báo cáo
        </h2>

        {/* 3 input: chọn event, từ ngày, đến ngày */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dropdown chọn sự kiện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sự kiện
            </label>
            <select
              value={selectedEventId} // state điều khiển
              onChange={(e) => setSelectedEventId(e.target.value)} // đổi event -> fetchStats chạy
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {/* Khi đang loading event list */}
              {eventsLoading && <option>Đang tải...</option>}

              {/* Option “tất cả” (nhưng note: code hiện vẫn fetchStats khi selectedEventId rỗng sẽ reset selectedStats) */}
              {!eventsLoading && <option value="">-- Tất cả sự kiện trong khoảng thời gian --</option>}

              {/* Render danh sách sự kiện đã lọc theo dateRange */}
              {filteredEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>

            {/* Nếu có lỗi load events */}
            {eventsError && (
              <p className="mt-1 text-xs text-red-500">{eventsError}</p>
            )}
          </div>

          {/* Input ngày bắt đầu */}
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

          {/* Input ngày kết thúc */}
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

        {/* Nút “Lọc và tính tổng”: gọi handleFilterAndAggregate */}
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

      {/* ===================== Charts ===================== */}
      {/* 2 biểu đồ: bar chart + pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* -------- Event Attendance Chart (BarChart) -------- */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {aggregatedStats
              ? `Biểu đồ tổng hợp (${aggregatedStats.eventsCount} sự kiện)`
              : 'Thống kê tham dự theo sự kiện (đang chọn)'}
          </h2>

          {/* Nếu đang load stats (và không phải đang xem tổng hợp) */}
          {statsLoading && !aggregatedStats ? (
            <p className="text-gray-500 text-sm">Đang tải thống kê...</p>

          ) : statsError && !aggregatedStats ? (
            // Nếu lỗi load stats của event đang chọn
            <p className="text-red-500 text-sm">{statsError}</p>

          ) : (
            // Render BarChart
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />

                {/* 3 cột: đăng ký / check-in / check-out */}
                <Bar dataKey="Đã đăng ký" fill="#3b82f6" />
                <Bar dataKey="Đã check-in" fill="#10b981" />
                <Bar dataKey="Đã check-out" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* -------- Check-in Status Pie Chart -------- */}
        {/* Chỉ render pie khi có aggregatedStats hoặc có đủ selectedEvent + selectedStats */}
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
                  // label hiển thị % mỗi phần
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {/* Tô màu cho từng phần pie dựa trên entry.color */}
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

      {/* ===================== Aggregated Results ===================== */}
      {/* Nếu aggregatedStats tồn tại => hiển thị bảng tổng hợp */}
      {aggregatedStats && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              Thống kê tổng hợp ({aggregatedStats.eventsCount} sự kiện)
            </h2>

            {/* 4 ô tổng hợp: đăng ký, check-in, check-out, chưa check-in */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đã check-out</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {aggregatedStats.totalCheckedOut}
                    </p>
                  </div>
                  <XCircle className="w-10 h-10 text-purple-500" />
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

            {/* Tỷ lệ tổng hợp */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-8">
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

              <p className="text-sm text-gray-600">
                Tỷ lệ check-out:{' '}
                <span className="font-bold text-lg text-purple-600">
                  {aggregatedStats.totalCheckedIn > 0
                    ? Math.round(
                        (aggregatedStats.totalCheckedOut /
                          aggregatedStats.totalCheckedIn) *
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

      {/* ===================== Hướng dẫn sử dụng ===================== */}
      {/* Nếu chưa chọn event (selectedEvent null) và chưa có tổng hợp -> hiện hướng dẫn */}
      {!selectedEvent && !aggregatedStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Hướng dẫn sử dụng</h2>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>Chọn khoảng thời gian:</strong> Sử dụng "Từ ngày" và "Đến ngày" để lọc các sự kiện trong khoảng thời gian cụ thể</p>
            <p>• <strong>Xem tổng hợp:</strong> Nhấn nút "Lọc và tính tổng" để xem thống kê tổng hợp của tất cả sự kiện trong khoảng thời gian</p>
            <p>• <strong>Xem chi tiết:</strong> Chọn 1 sự kiện cụ thể để xem thống kê chi tiết cho sự kiện đó</p>
          </div>

          {/* Thông tin phụ: đang lọc được bao nhiêu event */}
          <p className="mt-4 text-sm text-gray-500 italic">
            Hiện tại: Đang hiển thị {filteredEvents.length} sự kiện
            {(dateRange.start || dateRange.end) && ' trong khoảng thời gian đã chọn'}
          </p>
        </div>
      )}
    </div>
  )
}
