import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Html5Qrcode } from 'html5-qrcode'
import { Scan, CheckCircle, XCircle, Search } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function CheckIn() {
  const { user: _user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean
    message: string
    registration?: any
  } | null>(null)

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const html5QrCode = new Html5Qrcode('reader')
      scannerRef.current = html5QrCode
      
      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          processCheckIn(decodedText)
          stopScanning()
        },
        () => {
          // Ignore errors - errorMessage not used
        }
      ).catch((err) => {
        console.error('Unable to start scanning', err)
      })
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [scanning])

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScanning(false)
  }

  const processCheckIn = (qrCode: string) => {
    // Temporary - replace with API call later
    const mockRegistrations: any[] = []
    const registration = mockRegistrations.find((r: any) => r.qrCode === qrCode)
    
    if (!registration) {
      setCheckInResult({
        success: false,
        message: 'Không tìm thấy vé với mã QR này'
      })
      return
    }

    if (registration.checkedIn) {
      setCheckInResult({
        success: false,
        message: 'Vé này đã được check-in trước đó',
        registration
      })
      return
    }

    // Mock check-in
    setCheckInResult({
      success: true,
      message: 'Check-in thành công!',
      registration: {
        ...registration,
        checkedIn: true,
        checkedInAt: new Date().toISOString()
      }
    })
  }

  const handleManualCheckIn = () => {
    if (manualCode.trim()) {
      processCheckIn(manualCode.trim())
      setManualCode('')
    }
  }

  const resetResult = () => {
    setCheckInResult(null)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Check-in sự kiện</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quét mã QR</h2>
          
          {!scanning ? (
            <div className="space-y-4">
              <button
                onClick={() => setScanning(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Scan className="w-5 h-5 mr-2" />
                Bắt đầu quét
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập mã QR thủ công
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Nhập mã QR"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                  />
                  <button
                    onClick={handleManualCheckIn}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
                <div id="reader" style={{ width: '100%', height: '100%' }}></div>
              </div>
              <button
                onClick={() => {
                  stopScanning()
                  resetResult()
                }}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Dừng quét
              </button>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Kết quả check-in</h2>
          
          {!checkInResult ? (
            <div className="text-center py-12 text-gray-500">
              <Scan className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có kết quả check-in</p>
              <p className="text-sm mt-2">Quét mã QR hoặc nhập mã thủ công để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkInResult.success ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-xl font-semibold text-green-600 mb-2">
                    {checkInResult.message}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p className="text-xl font-semibold text-red-600 mb-2">
                    {checkInResult.message}
                  </p>
                </div>
              )}

              {checkInResult.registration && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Họ tên:</p>
                    <p className="font-medium">{checkInResult.registration.userName}</p>
                  </div>
                  {checkInResult.registration.studentId && (
                    <div>
                      <p className="text-sm text-gray-600">Mã sinh viên:</p>
                      <p className="font-medium">{checkInResult.registration.studentId}</p>
                    </div>
                  )}
                  {checkInResult.registration.seatNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Ghế ngồi:</p>
                      <p className="font-medium">{checkInResult.registration.seatNumber}</p>
                    </div>
                  )}
                  {checkInResult.registration.checkedInAt && (
                    <div>
                      <p className="text-sm text-gray-600">Thời gian check-in:</p>
                      <p className="font-medium">
                        {format(new Date(checkInResult.registration.checkedInAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </p>
                    </div>
                  )}
                  {(() => {
                    // Temporary - event data not available
                    const event: any = null
                    return event ? (
                      <div>
                        <p className="text-sm text-gray-600">Sự kiện:</p>
                        <p className="font-medium">{event.title}</p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <button
                onClick={resetResult}
                className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Check-in tiếp theo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

