export type NotificationItem = {
  id: number
  title: string
  content: string
  linkUrl: string
  createdAt: number
  read: boolean
}

export async function getMyNotifications(token: string | null): Promise<NotificationItem[]> {
  if (!token) throw new Error('Chưa đăng nhập')

  const res = await fetch('/api/notifications/my', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    credentials: 'include',
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Không có quyền truy cập thông báo')
    throw new Error(`HTTP ${res.status}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}
