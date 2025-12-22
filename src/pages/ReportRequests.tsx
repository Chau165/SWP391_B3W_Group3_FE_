import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { ExternalLink, ImageIcon } from 'lucide-react'

type ReportSummary = {
  reportId: number
  ticketId: number
  studentName: string
  categoryTicketName?: string
  reportStatus: string
  createdAt: string
}

type ReportDetail = {
  reportId: number
  ticketId: number
  title?: string
  description?: string
  imageUrl?: string | null
  createdAt?: string
  reportStatus?: string
  studentId?: number
  studentName?: string
  ticketStatus?: string
  categoryTicketId?: number
  categoryTicketName?: string
  price?: number
}

export default function ReportRequests() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [selected, setSelected] = useState<ReportDetail | null>(null)
  const [processing, setProcessing] = useState(false)
  const [staffNote, setStaffNote] = useState('')
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PROCESSED'>('PENDING')

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Vui lòng đăng nhập lại')
        }

        const res = await fetch('/api/staff/reports', {
          method: 'GET',
          credentials: 'include',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        })

        const responseText = await res.text()
        console.log('List response status:', res.status)
        console.log('List response:', responseText.substring(0, 200))

        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('JSON parse error. Response was:', responseText.substring(0, 500))
          throw new Error('Server trả về định dạng không hợp lệ. Vui lòng kiểm tra URL backend.')
        }

        // Check if backend returns error response
        if (data.status === 'fail' || !res.ok) {
          throw new Error(data.message || 'Không thể tải danh sách yêu cầu')
        }

        // Handle different response formats
        const list = Array.isArray(data)
          ? data
          : data && Array.isArray(data.data)
          ? data.data
          : []

        // Map minimal fields
        const mapped: ReportSummary[] = list.map((r: any) => ({
          reportId: r.reportId ?? r.id ?? 0,
          ticketId: r.ticketId ?? r.ticket_id ?? 0,
          studentName: r.studentName ?? r.student_name ?? 'Unknown',
          categoryTicketName: r.categoryTicketName ?? r.category_ticket_name,
          reportStatus: r.reportStatus ?? r.status ?? 'PENDING',
          createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
        }))

        setReports(mapped)
      } catch (err: any) {
        console.error('Fetch reports error', err)
        setError(err.message || 'Lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const openDetail = async (reportId: number) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại')
      }

      const res = await fetch(`/api/staff/reports/detail?reportId=${reportId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
      })

      // Log response for debugging
      const responseText = await res.text()
      console.log('Response status:', res.status)
      console.log('Response text:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error. Response was:', responseText.substring(0, 500))
        throw new Error('Server trả về định dạng không hợp lệ. Vui lòng kiểm tra URL backend.')
      }

      // Check backend response format: {status: 'success'|'fail', data: ..., message: ...}
      if (data.status === 'fail' || !res.ok) {
        throw new Error(data.message || 'Không thể tải chi tiết')
      }

      // Extract detail from {status:'success', data: {...}}
      const detail = data.data ?? data
      setSelected(detail)
    } catch (err: any) {
      console.error('Open detail error', err)
      setError(err.message || 'Không thể tải chi tiết')
    } finally {
      setLoading(false)
    }
  }

  const closeDetail = () => setSelected(null)

  const processReport = async (reportId: number, action: 'APPROVE' | 'REJECT') => {
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Vui lòng đăng nhập lại')

      const res = await fetch('/api/staff/reports/process', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, action, staffNote }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        throw new Error(data?.message || 'Xử lý thất bại')
      }

      if (data.status === 'fail') {
        throw new Error(data.message || 'Xử lý thất bại')
      }

      // Update selected and list status
      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      setSelected((prev) => prev ? { ...prev, reportStatus: newStatus } : prev)
      setReports((prev) => prev.map(r => r.reportId === reportId ? { ...r, reportStatus: newStatus } : r))

      showToast('success', data.message || 'Xử lý thành công')
    } catch (err: any) {
      console.error('Process report error', err)
      showToast('error', err.message || 'Có lỗi xảy ra')
    } finally {
      setProcessing(false)
    }
  }

  const pendingReports = reports.filter(r => (r.reportStatus ?? '').toUpperCase() === 'PENDING')
  const processedReports = reports.filter(r => {
    const s = (r.reportStatus ?? '').toUpperCase()
    return s === 'APPROVED' || s === 'REJECTED'
  })
  const displayList = activeTab === 'PENDING' ? pendingReports : processedReports

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Yêu cầu hoàn tiền / Báo cáo lỗi</h1>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-6">Đang tải...</div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow-md p-6 text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded ${activeTab === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Chưa Xử Lí ({pendingReports.length})
            </button>
            <button
              onClick={() => setActiveTab('PROCESSED')}
              className={`px-4 py-2 rounded ${activeTab === 'PROCESSED' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Đã Xử Lí ({processedReports.length})
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Report ID</th>
                <th className="text-left px-4 py-3">Ticket ID</th>
                <th className="text-left px-4 py-3">Người gửi</th>
                <th className="text-left px-4 py-3">Loại vé</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Ngày gửi</th>
                <th className="text-left px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((r) => (
                <tr key={r.reportId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{r.reportId}</td>
                  <td className="px-4 py-3">{r.ticketId}</td>
                  <td className="px-4 py-3">{r.studentName}</td>
                  <td className="px-4 py-3">{r.categoryTicketName ?? '-'}</td>
                  <td className="px-4 py-3">{r.reportStatus}</td>
                  <td className="px-4 py-3">{format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(r.reportId)}
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      Xem chi tiết <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Không có yêu cầu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Chi tiết yêu cầu #{selected.reportId}</h2>
              <button onClick={closeDetail} className="text-gray-600 hover:text-gray-800">Đóng</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Report ID</p>
                  <p className="font-medium">{selected.reportId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="font-medium">{selected.ticketId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người gửi</p>
                  <p className="font-medium">{selected.studentName} (ID: {selected.studentId ?? '-'})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loại vé</p>
                  <p className="font-medium">{selected.categoryTicketName ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái báo cáo</p>
                  <p className="font-medium">{selected.reportStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket status</p>
                  <p className="font-medium">{selected.ticketStatus ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá</p>
                  <p className="font-medium">{selected.price ? selected.price.toLocaleString('vi-VN') + ' ₫' : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-medium">{selected.createdAt ? format(new Date(selected.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Tiêu đề</p>
                <p className="font-medium">{selected.title ?? '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Mô tả</p>
                <p className="whitespace-pre-line">{selected.description ?? '-'}</p>
              </div>

              {selected.imageUrl && (
                  <div>
                    <p className="text-sm text-gray-500">Ảnh minh chứng</p>
                    <div className="mt-2">
                      <img
                        src={selected.imageUrl}
                        alt="Ảnh minh chứng"
                        className="w-full max-h-80 object-contain rounded-lg border"
                      />
                    </div>
                  </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Ghi chú của nhân viên</p>
                <textarea
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="Ghi chú xử lý (tùy chọn)"
                  className="w-full mt-2 border rounded p-2 h-24"
                />

                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={async () => {
                      if (!selected) return
                      const ok = window.confirm('Bạn chắc chắn muốn từ chối yêu cầu này?')
                      if (!ok) return
                      await processReport(selected.reportId, 'REJECT')
                    }}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                  >
                    Từ Chối
                  </button>

                  <button
                    onClick={async () => {
                      if (!selected) return
                      const ok = window.confirm('Bạn chắc chắn muốn duyệt yêu cầu này?')
                      if (!ok) return
                      await processReport(selected.reportId, 'APPROVE')
                    }}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                  >
                    Duyệt
                  </button>

                  <button onClick={closeDetail} className="px-4 py-2 border rounded">Đóng</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
