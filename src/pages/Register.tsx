import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import axios from 'axios'
import ReCAPTCHA from 'react-google-recaptcha'
import fptLogo from '../assets/fpt-logo.png'
import fptCampus from '../assets/dai-hoc-fpt-tp-hcm-1.jpeg'

// Use proxy to avoid CORS issues in development
const API_URL = '/api'

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.headers.common['Accept'] = 'application/json'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
  otp: string
}

// reCAPTCHA site key - HƯỚNG DẪN:
// 1. Truy cập: https://www.google.com/recaptcha/admin/create
// 2. Chọn reCAPTCHA v2 (checkbox)
// 3. Thêm domain: localhost và domain production
// 4. Copy Site Key và dán vào đây
const RECAPTCHA_SITE_KEY = '6LeVFSUsAAAAAMas_aThh1RZtxiGjWgRquLuAoTU' // Test key - THAY BẰNG SITE KEY THẬT
const USE_REAL_RECAPTCHA = true // Đổi thành true khi đã có Site Key thật

export default function Register() {
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    otp: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const navigate = useNavigate()

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: number
    if (otpCountdown > 0) {
      timer = window.setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [otpCountdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return false
    }
    return true
  }

  const handleSendOtp = async () => {
    // Validate reCAPTCHA nếu dùng mode thật
    if (USE_REAL_RECAPTCHA && !recaptchaToken) {
      setError('Vui lòng xác nhận bạn không phải là robot!')
      return
    }

    // Validate required fields
    if (!formData.fullName || formData.fullName.trim() === '') {
      setError('Vui lòng nhập họ và tên!')
      return
    }

    if (!formData.phone || formData.phone.trim() === '') {
      setError('Vui lòng nhập số điện thoại!')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      setError('Vui lòng nhập email hợp lệ!')
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    setLoading(true)
    try {
      console.log('Sending OTP request:', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      })
      
      const response = await axios.post(`${API_URL}/register/send-otp`, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        recaptchaToken: USE_REAL_RECAPTCHA ? recaptchaToken : 'TEST_BYPASS'
      })

      console.log('Send OTP Response:', response.data)

      // Enable OTP field if request is successful (status 200)
      setIsOtpSent(true)
      setOtpCountdown(60) // Start 60 second countdown
      setError('')
      
      if (response.data.status === 'success' || response.status === 200) {
        alert('Mã OTP đã được gửi đến email của bạn!')
      } else {
        // Still enable OTP field but show warning
        const warningMsg = response.data.message || 'Vui lòng kiểm tra email để lấy mã OTP'
        alert(warningMsg)
      }
    } catch (err: any) {
      console.error('Send OTP Error:', err)
      console.error('Error response:', err.response?.data)
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error ||
                      'Đã xảy ra lỗi khi gửi OTP. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      console.log('Resending OTP to:', formData.email)
      
      const response = await axios.post(`${API_URL}/register/resend-otp`, {
        email: formData.email
      })

      console.log('Resend OTP Response:', response.data)

      setOtpCountdown(60) // Restart countdown
      setError('')
      
      if (response.data.status === 'success' || response.status === 200) {
        showToast('success', 'Mã OTP mới đã được gửi lại!')
      } else {
        showToast('info', 'Mã OTP đã được gửi lại. Vui lòng kiểm tra email.')
      }
    } catch (err: any) {
      console.error('Resend OTP Error:', err)
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error ||
                      'Không thể gửi lại OTP. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/register/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        recaptchaToken: USE_REAL_RECAPTCHA ? recaptchaToken : 'TEST_BYPASS'
      })

      console.log('Register Response:', response.data)

      if (response.data.status === 'success') {
        showToast('success', 'Đăng ký thành công! Vui lòng đăng nhập.')
        navigate('/login')
      } else {
        setError(response.data.message || 'Đăng ký thất bại')
      }
    } catch (err: any) {
      console.error('Register Error:', err)
      setError(
        err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    
    try {
      await handleRegister()
    } catch (err: any) {
      console.error('Register Error:', err)
      
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!'
      
      if (err.message && err.message.includes('Backend đã chạy')) {
        errorMessage = err.message
      } else if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || `Lỗi ${err.response.status}: ${err.response.statusText}`
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Không thể kết nối đến server!\n\n⚠️ Vui lòng kiểm tra:\n1. Backend đã chạy chưa? (http://localhost:8080)\n2. CORS đã được cấu hình trong backend chưa?'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url(${fptCampus})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-white/50 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={fptLogo} 
              alt="FPT Education" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-gray-600 mt-2">Đăng ký vào hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nguyễn Văn A"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="0901234567"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@fpt.edu.vn"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Nhập mật khẩu"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Nhập lại mật khẩu"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Mã OTP
            </label>
            <div className="flex gap-2">
              <input
                id="otp"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Nhập mã OTP"
                required
                disabled={!isOtpSent}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={isOtpSent ? handleResendOtp : handleSendOtp}
                disabled={!formData.email || (isOtpSent && otpCountdown > 0) || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {isOtpSent 
                  ? (otpCountdown > 0 ? `${otpCountdown}s` : 'Gửi lại')
                  : 'Gửi OTP'
                }
              </button>
            </div>
            {isOtpSent && (
              <p className="text-xs text-green-600 mt-1">
                Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => {
                setRecaptchaToken(token)
                setError('')
              }}
              onExpired={() => setRecaptchaToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isOtpSent}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
