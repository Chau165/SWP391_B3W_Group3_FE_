# Các Chức Năng Còn Thiếu Dựa Trên ERD

## 📋 Tổng Quan

Dựa trên ERD (Entity-Relationship Diagram) và codebase hiện tại, dưới đây là danh sách các chức năng còn thiếu:

---

## 🔴 1. QUẢN LÝ HÓA ĐƠN (Bill Management)

**Entity trong ERD:** `Bill`
**Relationships:**
- Students (1) -- (Has) -- (N) Bill
- Bill (1) -- (is for) -- (N) Ticket

**Chức năng thiếu:**
- ❌ Trang xem danh sách hóa đơn của sinh viên (`/my-bills`)
- ❌ Trang chi tiết hóa đơn (`/bills/:id`)
- ❌ Hiển thị thông tin thanh toán (số tiền, ngày thanh toán, trạng thái)
- ❌ Liên kết hóa đơn với các vé đã mua
- ❌ Lịch sử giao dịch thanh toán
- ❌ Xuất hóa đơn PDF
- ❌ Tích hợp cổng thanh toán (payment gateway)

**Gợi ý implementation:**
```
src/pages/
├── MyBills.tsx          # Danh sách hóa đơn của sinh viên
├── BillDetail.tsx       # Chi tiết hóa đơn
└── Payment.tsx          # Trang thanh toán
```

---

## 🔴 2. HỆ THỐNG YÊU CẦU SỰ KIỆN (Event Request System)

**Entity trong ERD:** `Event_Request`
**Relationships:**
- Students (N) -- (Send) -- (1) Event_Request

**Chức năng thiếu:**
- ❌ Trang gửi yêu cầu tổ chức sự kiện (`/event-requests/create`)
- ❌ Form gửi yêu cầu (tiêu đề, mô tả, lý do, thời gian đề xuất)
- ❌ Trang quản lý yêu cầu sự kiện cho Organizer/Staff (`/event-requests`)
- ❌ Xem danh sách yêu cầu đã gửi (`/my-event-requests`)
- ❌ Phê duyệt/từ chối yêu cầu
- ❌ Trạng thái yêu cầu (Pending, Approved, Rejected)
- ❌ Thông báo khi yêu cầu được xử lý

**Gợi ý implementation:**
```
src/pages/
├── EventRequestCreate.tsx    # Tạo yêu cầu sự kiện
├── EventRequests.tsx          # Quản lý yêu cầu (cho Organizer/Staff)
└── MyEventRequests.tsx        # Yêu cầu của sinh viên
```

---

## 🔴 3. QUẢN LÝ DIỄN GIẢ (Speaker Management)

**Entity trong ERD:** `Speaker`
**Relationships:**
- Event (1) -- (Has) -- (N) Speaker

**Chức năng thiếu:**
- ❌ CRUD diễn giả (Create, Read, Update, Delete)
- ❌ Trang danh sách diễn giả (`/speakers`)
- ❌ Thêm/sửa/xóa diễn giả trong form tạo/sửa sự kiện
- ❌ Quản lý thông tin diễn giả (tên, chức danh, mô tả, ảnh)
- ❌ Gán nhiều diễn giả cho một sự kiện
- ❌ Lịch sử diễn giả đã tham gia các sự kiện

**Gợi ý implementation:**
```
src/pages/
├── Speakers.tsx          # Danh sách diễn giả
├── SpeakerCreate.tsx     # Tạo diễn giả mới
├── SpeakerEdit.tsx      # Sửa thông tin diễn giả
└── SpeakerDetail.tsx     # Chi tiết diễn giả
```

**Cần cập nhật:**
- `EventCreate.tsx` - Thêm chọn diễn giả
- `EventEdit.tsx` - Thêm chọn diễn giả
- `EventDetail.tsx` - Hiển thị danh sách diễn giả (hiện chỉ hiển thị 1)

---

## 🔴 4. QUẢN LÝ ĐỊA ĐIỂM (Venue Management)

**Entity trong ERD:** `Venue`
**Relationships:**
- Venue (1) -- (use) -- (N) Event
- Seat (N) -- (Belong to) -- (1) Venue

**Chức năng thiếu:**
- ❌ CRUD địa điểm (Create, Read, Update, Delete)
- ❌ Trang danh sách địa điểm (`/venues`)
- ❌ Quản lý thông tin địa điểm (tên, địa chỉ, sức chứa, mô tả)
- ❌ Quản lý khu vực (Area) trong địa điểm
- ❌ Quản lý tầng (Floor) trong địa điểm
- ❌ Chọn địa điểm khi tạo sự kiện (thay vì nhập text)
- ❌ Xem lịch sử sử dụng địa điểm
- ❌ Kiểm tra tính khả dụng của địa điểm theo thời gian

**Gợi ý implementation:**
```
src/pages/
├── Venues.tsx           # Danh sách địa điểm
├── VenueCreate.tsx      # Tạo địa điểm mới
├── VenueEdit.tsx        # Sửa thông tin địa điểm
├── VenueDetail.tsx      # Chi tiết địa điểm
└── VenueCalendar.tsx    # Lịch sử dụng địa điểm
```

**Cần cập nhật:**
- `EventCreate.tsx` - Dropdown chọn Venue thay vì input text
- `EventEdit.tsx` - Dropdown chọn Venue
- `EventDetail.tsx` - Hiển thị thông tin Venue chi tiết hơn

---

## 🔴 5. QUẢN LÝ LOẠI VÉ (Category Ticket Management)

**Entity trong ERD:** `Category_Ticket`
**Relationships:**
- Category_Ticket (1) -- (Has) -- (N) Ticket

**Chức năng thiếu:**
- ❌ CRUD loại vé (Create, Read, Update, Delete)
- ❌ Trang quản lý loại vé (`/category-tickets`)
- ❌ Tạo loại vé khi tạo sự kiện
- ❌ Quản lý giá vé, số lượng tối đa
- ❌ Trạng thái loại vé (Available, Sold Out, Inactive)
- ❌ Lịch sử bán vé theo loại

**Gợi ý implementation:**
```
src/pages/
├── CategoryTickets.tsx      # Danh sách loại vé
└── CategoryTicketCreate.tsx # Tạo loại vé mới
```

**Cần cập nhật:**
- `EventCreate.tsx` - Form tạo Category Ticket
- `EventEdit.tsx` - Form sửa Category Ticket

---

## 🔴 6. QUY TRÌNH MUA VÉ HOÀN CHỈNH (Complete Ticket Purchase Flow)

**Entity trong ERD:** `Ticket`
**Relationships:**
- Students (1) -- (Buy) -- (N) Ticket
- Ticket (N) -- (Assign) -- (1) Seat
- Category_Ticket (1) -- (Has) -- (N) Ticket

**Chức năng thiếu:**
- ❌ Trang thanh toán sau khi chọn ghế (`/payment`)
- ❌ Xác nhận đơn hàng trước khi thanh toán
- ❌ Tích hợp cổng thanh toán (VNPay, MoMo, Banking)
- ❌ Tạo hóa đơn sau khi thanh toán thành công
- ❌ Tạo vé (Ticket) sau khi thanh toán thành công
- ❌ Gửi email xác nhận mua vé
- ❌ Xử lý thanh toán thất bại
- ❌ Hoàn tiền (refund) nếu cần

**Hiện tại:**
- ✅ Có chọn ghế (trong `Dashboard.tsx` và `EventDetail.tsx`)
- ❌ Chưa có bước thanh toán
- ❌ Chưa tạo vé sau khi chọn ghế

**Gợi ý implementation:**
```
src/pages/
├── Payment.tsx          # Trang thanh toán
├── PaymentSuccess.tsx   # Thanh toán thành công
└── PaymentFailed.tsx    # Thanh toán thất bại
```

**Cần cập nhật:**
- `Dashboard.tsx` - `confirmSeat()` → chuyển sang trang thanh toán
- `EventDetail.tsx` - `confirmSeat()` → chuyển sang trang thanh toán

---

## 🔴 7. QUẢN LÝ NGƯỜI TỔ CHỨC (Event Organizer Management)

**Entity trong ERD:** `Event Organizer`
**Relationships:**
- Event Organizer (1) -- (Create) -- (N) Event
- Event Organizer (N) -- (Has) -- (N) Event

**Chức năng thiếu:**
- ❌ Trang quản lý người tổ chức (`/organizers`) - cho Staff/Admin
- ❌ CRUD người tổ chức
- ❌ Phân quyền cho người tổ chức
- ❌ Xem danh sách sự kiện của từng người tổ chức
- ❌ Thống kê hoạt động của người tổ chức
- ❌ Gán nhiều người tổ chức cho một sự kiện (many-to-many)

**Gợi ý implementation:**
```
src/pages/
├── Organizers.tsx        # Danh sách người tổ chức
├── OrganizerCreate.tsx  # Tạo người tổ chức mới
├── OrganizerEdit.tsx    # Sửa thông tin
└── OrganizerDetail.tsx  # Chi tiết + danh sách sự kiện
```

**Cần cập nhật:**
- `EventCreate.tsx` - Chọn Event Organizer từ dropdown
- `EventEdit.tsx` - Chọn Event Organizer

---

## 🔴 8. QUẢN LÝ GHẾ NÂNG CAO (Advanced Seat Management)

**Entity trong ERD:** `Seat`
**Relationships:**
- Seat (N) -- (Belong to) -- (1) Venue
- Ticket (N) -- (Assign) -- (1) Seat

**Chức năng thiếu:**
- ❌ Tạo ghế tự động từ Venue khi tạo sự kiện
- ❌ Import ghế từ file Excel/CSV
- ❌ Quản lý hàng ghế (row) và cột ghế (column)
- ❌ Đánh dấu ghế VIP/ưu tiên
- ❌ Khóa/mở khóa ghế thủ công
- ❌ Xem lịch sử sử dụng ghế
- ❌ Thống kê tỷ lệ sử dụng ghế

**Hiện tại:**
- ✅ Có trang `SeatManagement.tsx` nhưng chỉ hiển thị
- ❌ Chưa có chức năng tạo/sửa/xóa ghế

**Cần cập nhật:**
- `SeatManagement.tsx` - Thêm CRUD ghế
- `EventCreate.tsx` - Tạo ghế tự động khi chọn Venue

---

## 🔴 9. THÔNG BÁO VÀ EMAIL (Notifications & Email)

**Chức năng thiếu:**
- ❌ Hệ thống thông báo trong app
- ❌ Gửi email xác nhận đăng ký sự kiện
- ❌ Gửi email nhắc nhở trước sự kiện
- ❌ Thông báo khi yêu cầu sự kiện được phê duyệt/từ chối
- ❌ Thông báo khi có sự kiện mới
- ❌ Thông báo khi vé được mua thành công
- ❌ Thông báo khi check-in thành công

**Gợi ý implementation:**
```
src/
├── components/
│   └── NotificationCenter.tsx  # Component hiển thị thông báo
├── contexts/
│   └── NotificationContext.tsx # Quản lý thông báo
└── services/
    └── emailService.ts          # Service gửi email
```

---

## 🔴 10. TÌM KIẾM VÀ LỌC NÂNG CAO (Advanced Search & Filter)

**Chức năng thiếu:**
- ❌ Tìm kiếm sự kiện theo tên, mô tả, diễn giả
- ❌ Lọc sự kiện theo loại, trạng thái, thời gian
- ❌ Lọc sự kiện theo địa điểm
- ❌ Sắp xếp sự kiện (theo ngày, tên, số người tham gia)
- ❌ Tìm kiếm vé theo mã QR, mã sinh viên
- ❌ Tìm kiếm trong báo cáo

**Cần cập nhật:**
- `Events.tsx` - Thêm search và filter
- `MyTickets.tsx` - Thêm search
- `Reports.tsx` - Cải thiện filter

---

## 🔴 11. XUẤT BÁO CÁO (Export Reports)

**Chức năng thiếu:**
- ❌ Xuất báo cáo Excel
- ❌ Xuất báo cáo PDF
- ❌ Xuất danh sách đăng ký
- ❌ Xuất danh sách check-in
- ❌ Xuất hóa đơn PDF
- ❌ Xuất thống kê theo khoảng thời gian

**Hiện tại:**
- ✅ Có nút "Xuất báo cáo" trong `Reports.tsx` nhưng chưa implement

**Cần cập nhật:**
- `Reports.tsx` - Implement export functionality
- `MyBills.tsx` (cần tạo) - Export hóa đơn PDF

---

## 🔴 12. QUẢN LÝ NGƯỜI DÙNG (User Management)

**Chức năng thiếu:**
- ❌ Trang quản lý người dùng (cho Admin/Staff)
- ❌ Phân quyền chi tiết
- ❌ Khóa/mở khóa tài khoản
- ❌ Xem lịch sử hoạt động của người dùng
- ❌ Quản lý profile người dùng

**Gợi ý implementation:**
```
src/pages/
├── Users.tsx            # Danh sách người dùng
├── UserDetail.tsx       # Chi tiết người dùng
└── Profile.tsx          # Trang profile cá nhân
```

---

## 📊 Tổng Kết Ưu Tiên

### **Ưu tiên cao (Core Features):**
1. ✅ Quy trình mua vé hoàn chỉnh (Payment Flow)
2. ✅ Quản lý hóa đơn (Bill Management)
3. ✅ Hệ thống yêu cầu sự kiện (Event Request)
4. ✅ Quản lý địa điểm (Venue Management)

### **Ưu tiên trung bình:**
5. ✅ Quản lý diễn giả (Speaker Management)
6. ✅ Quản lý loại vé (Category Ticket)
7. ✅ Quản lý người tổ chức (Organizer Management)
8. ✅ Xuất báo cáo (Export Reports)

### **Ưu tiên thấp (Nice to have):**
9. ✅ Thông báo và Email
10. ✅ Tìm kiếm và lọc nâng cao
11. ✅ Quản lý ghế nâng cao
12. ✅ Quản lý người dùng

---

## 📝 Lưu Ý

- Một số chức năng đã có UI nhưng chưa có logic xử lý (như xuất báo cáo)
- Cần tích hợp với Backend API để hoàn thiện các chức năng
- Cần thêm validation và error handling cho các form
- Cần thêm loading states và error messages cho UX tốt hơn

