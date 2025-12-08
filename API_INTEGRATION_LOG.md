# API Integration Log - Event Management System

**Ngày:** 7-8/12/2025  
**Developer:** Lê Quang Huy (ORGANIZER role)

## 🎯 Mục tiêu
Kết nối các API cho hệ thống quản lý sự kiện với workflow: ORGANIZER tạo request → STAFF duyệt với area → ORGANIZER cập nhật chi tiết → Mở bán vé

---

## ✅ Đã hoàn thành

### 1. EventRequestCreate.tsx - Tạo yêu cầu sự kiện
**File:** `src/pages/EventRequestCreate.tsx`

**API:** `POST http://localhost:3000/api/event-requests`

**Payload:**
```json
{
  "title": "string",
  "description": "string",
  "reason": "string",
  "preferredStart": "ISO datetime",
  "preferredEnd": "ISO datetime",
  "expectedParticipants": number
}
```

**Note:** Không upload banner ở phase này (sẽ upload sau khi được duyệt)

---

### 2. EventRequests.tsx - Xem và quản lý yêu cầu
**File:** `src/pages/EventRequests.tsx`

#### API cho ORGANIZER:
- **GET** `http://localhost:3000/api/event-requests/my`
- Xem tất cả yêu cầu của chính mình (PENDING, APPROVED, REJECTED)
- Không có quyền approve/reject

#### API cho STAFF/ADMIN:
- **GET** `http://localhost:3000/api/event-requests`
- Xem tất cả yêu cầu PENDING của mọi Organizer
- Có quyền approve/reject

#### Approve Request với Area Selection:
1. Fetch available areas: **GET** `http://localhost:3000/api/areas/free?startTime={ISO}&endTime={ISO}`
2. Submit approval: **POST** `http://localhost:3000/api/event-requests/process`

**Approve Payload:**
```json
{
  "requestId": number,
  "action": "APPROVE",
  "areaId": number
}
```

#### Reject Request:
**POST** `http://localhost:3000/api/event-requests/process`

**Reject Payload:**
```json
{
  "requestId": number,
  "action": "REJECT"
}
```

---

### 3. Layout.tsx - Navigation Updates
**File:** `src/components/Layout.tsx`

**Thay đổi:**
- ❌ Loại bỏ "Speakers" và "Venues" khỏi ORGANIZER menu
- ✅ Thêm "Yêu cầu của tôi" cho ORGANIZER
- ✅ Thêm "Quản lý yêu cầu" cho STAFF

---

## 📊 Response Types

### EventRequest Type:
```typescript
type EventRequest = {
  requestId: number
  title: string
  description?: string
  reason?: string
  preferredStart?: string
  preferredEnd?: string
  expectedParticipants?: number
  bannerUrl?: string
  studentName?: string
  createdAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}
```

### Area Type:
```typescript
type Area = {
  areaId: number
  areaName: string
  capacity: number
}
```

---

## 🔄 Workflow

```
┌─────────────────┐
│   ORGANIZER     │
│  Tạo request    │
│  (basic info)   │
└────────┬────────┘
         │
         ▼
    [PENDING]
         │
         ▼
┌─────────────────┐
│   STAFF/ADMIN   │
│  Xem request    │
│  Chọn area      │
│  Approve/Reject │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
[APPROVED] [REJECTED]
    │
    ▼
┌─────────────────┐
│   ORGANIZER     │
│ Xem trạng thái  │
│  Cập nhật chi   │
│  tiết (Phase 3) │
└─────────────────┘
```

---

## 🐛 Troubleshooting

### Issue 1: ORGANIZER không thấy requests
**Nguyên nhân:** Backend chưa implement endpoint `/api/event-requests/my`

**Giải pháp:** 
- Verify endpoint tồn tại trong backend
- Check JWT token trong localStorage
- Xem Console log để debug role và endpoint

### Issue 2: 404 Not Found
**Nguyên nhân:** Backend chưa có servlet mapping cho endpoint

**Giải pháp:**
- Kiểm tra backend code
- Verify URL đúng format
- Check CORS configuration

### Issue 3: Staff không thấy pending requests
**Nguyên nhân:** Backend filter chưa đúng hoặc chưa có data

**Giải pháp:**
- Tạo request từ ORGANIZER account trước
- Check database có data không
- Verify role checking trong backend

---

## 📝 Backend Requirements

Backend cần implement các endpoint sau:

1. ✅ `POST /api/event-requests` - Create request (ORGANIZER)
2. ✅ `GET /api/event-requests/my` - Get own requests (ORGANIZER)
3. ✅ `GET /api/event-requests` - Get all pending (STAFF/ADMIN)
4. ✅ `POST /api/event-requests/process` - Approve/Reject (STAFF/ADMIN)
5. ✅ `GET /api/areas/free` - Get available areas (STAFF/ADMIN)

**Backend cần:**
- JWT authentication
- Role-based authorization
- CORS configuration cho localhost:5173
- Error handling với JSON responses

---

## 🔜 Next Steps (Phase 3 & 4)

### Phase 3: ORGANIZER cập nhật chi tiết
**Khi request được APPROVED:**
- Tạo trang EventDetailUpdate.tsx
- Upload banner image
- Thêm speakers
- Cấu hình seat map
- API cần: `PUT /api/events/{eventId}`

### Phase 4: Mở bán vé
- Chuyển status từ DRAFT → OPEN
- API: `POST /api/events/{eventId}/open`
- Student filter: Chỉ hiển thị events có status=OPEN

---

## 📌 Notes

- Base URL: `http://localhost:3000/api`
- Authentication: Bearer token trong localStorage
- All requests cần header: `Authorization: Bearer {token}`
- Date format: ISO 8601 string
- Backend: Java Servlets + GSON

---

**Last Updated:** 8/12/2025  
**Status:** Phase 1 & 2 completed ✅
