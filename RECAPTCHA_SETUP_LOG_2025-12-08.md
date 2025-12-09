# Chat Log - Thiết lập reCAPTCHA
**Ngày:** 8 tháng 12, 2025  
**Nhánh:** Add-Google-reCAPTCHA-to-Login-and-Register-pages

## Tóm tắt công việc

### 1. Yêu cầu ban đầu
- Thêm reCAPTCHA vào form đăng ký và đăng nhập
- Backend đã hỗ trợ field `recaptchaToken` với giá trị bypass là `TEST_BYPASS`

### 2. Các bước đã thực hiện

#### Bước 1: Cài đặt thư viện
```bash
npm install react-google-recaptcha @types/react-google-recaptcha
```

#### Bước 2: Cập nhật index.html
Thêm script Google reCAPTCHA vào `index.html`:
```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

#### Bước 3: Cấu hình Login.tsx và Register.tsx
- Import thư viện `react-google-recaptcha`
- Thêm state `recaptchaToken` và `recaptchaRef`
- Thêm component `<ReCAPTCHA>` vào form
- Gửi `recaptchaToken` trong API request

#### Bước 4: Cấu hình Site Key
```typescript
// reCAPTCHA site key
const RECAPTCHA_SITE_KEY = '6LdzFCUsAAAAACKng2zcYCnJRurAxsMOtlF4Qt5O'
const USE_REAL_RECAPTCHA = false // false = dùng TEST_BYPASS, true = dùng token thật
```

### 3. Các loại reCAPTCHA đã thử nghiệm

#### A. Checkbox reCAPTCHA (v2 Tickbox)
- Hiển thị checkbox "I'm not a robot"
- Người dùng phải tick trước khi submit
- Có thể hiện challenge hình ảnh nếu Google nghi ngờ

**Cấu hình:**
```typescript
<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={RECAPTCHA_SITE_KEY}
  onChange={(token) => setRecaptchaToken(token)}
  onExpired={() => setRecaptchaToken(null)}
/>
```

#### B. Invisible reCAPTCHA
- Chạy ngầm, không hiện checkbox
- Tự động hiện challenge khi Google nghi ngờ là bot
- UX tốt hơn cho người dùng thật

**Cấu hình:**
```typescript
<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={RECAPTCHA_SITE_KEY}
  size="invisible"
  onChange={(token) => setRecaptchaToken(token)}
  onExpired={() => setRecaptchaToken(null)}
/>
```

### 4. Validation Logic

#### Login.tsx
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Bắt buộc phải xác thực reCAPTCHA
  if (!recaptchaToken) {
    setError('Vui lòng xác nhận bạn không phải là robot!')
    return
  }
  
  // Gửi request với token
  await axios.post('/api/login', {
    email: formData.email,
    password: formData.password,
    recaptchaToken: USE_REAL_RECAPTCHA ? recaptchaToken : 'TEST_BYPASS'
  })
}
```

#### Register.tsx
```typescript
const handleSendOtp = async () => {
  // Bắt buộc phải xác thực reCAPTCHA
  if (!recaptchaToken) {
    setError('Vui lòng xác nhận bạn không phải là robot!')
    return
  }
  
  // Gửi OTP
  await axios.post('/api/register/send-otp', {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
    recaptchaToken: USE_REAL_RECAPTCHA ? recaptchaToken : 'TEST_BYPASS'
  })
}
```

### 5. Cấu hình Google reCAPTCHA

#### Đăng ký Site Key
1. Truy cập: https://www.google.com/recaptcha/admin/create
2. Điền thông tin:
   - **Label:** FPT Event Management System
   - **reCAPTCHA type:** Challenge (v2) → "I'm not a robot" Tickbox
   - **Domains:** `localhost` (không cần http://, port, hoặc path)
3. Nhận được:
   - **Site Key:** Dùng trong frontend
   - **Secret Key:** Dùng trong backend để verify

#### Domains cho localhost
✅ Đúng: `localhost`, `127.0.0.1`  
❌ Sai: `http://localhost:3000/`, `localhost:3000`

### 6. Phân biệt Site Key vs Secret Key

| Khía cạnh | Site Key | Secret Key |
|-----------|----------|------------|
| **Dùng ở đâu** | Frontend (React) | Backend (Java/Node.js) |
| **Công khai** | ✅ Có thể thấy trong source code | ❌ Phải giữ bí mật |
| **Mục đích** | Hiển thị widget reCAPTCHA | Verify token với Google |
| **Ví dụ** | `6LdzFCUsAAAAACKng2zcYCnJRurAxsMOtlF4Qt5O` | `6LdzFCUsAAAAAGppXzHZW7q7YN5...` |

### 7. Luồng hoạt động

```
1. User nhập email/password
   ↓
2. User tick checkbox reCAPTCHA
   ↓
3. Google trả về token cho frontend
   ↓
4. Frontend gửi token lên backend
   ↓
5. Backend verify token với Google (dùng Secret Key)
   ↓
6. Google trả về success: true/false
   ↓
7. Backend cho phép/từ chối đăng nhập
```

### 8. Test Mode vs Production Mode

#### Test Mode (Hiện tại)
```typescript
const USE_REAL_RECAPTCHA = false
```
- Gửi `TEST_BYPASS` thay vì token thật
- Backend accept mà không verify với Google
- Dùng để development nhanh

#### Production Mode
```typescript
const USE_REAL_RECAPTCHA = true
```
- Gửi token thật từ Google
- Backend phải verify với Google
- Cần Secret Key trong backend

### 9. Backend Integration (Cần implement)

Backend cần verify token với Google:

```java
// Java example
String recaptchaToken = request.getRecaptchaToken();

if (!recaptchaToken.equals("TEST_BYPASS")) {
    // Verify với Google
    String url = "https://www.google.com/recaptcha/api/siteverify";
    String params = "secret=YOUR_SECRET_KEY&response=" + recaptchaToken;
    
    // Send POST request
    HttpResponse response = httpClient.post(url, params);
    
    // Parse JSON response
    JsonObject jsonResponse = parseJson(response.getBody());
    boolean success = jsonResponse.get("success").getAsBoolean();
    
    if (!success) {
        throw new Exception("Invalid reCAPTCHA");
    }
}
```

### 10. Các vấn đề đã gặp và giải quyết

#### Vấn đề 1: "Invalid reCAPTCHA" từ backend
**Nguyên nhân:** Backend chưa có Secret Key để verify token thật  
**Giải pháp:** Đổi `USE_REAL_RECAPTCHA = false` để dùng TEST_BYPASS

#### Vấn đề 2: Domain invalid khi đăng ký
**Nguyên nhân:** Nhập `http://localhost:3000/` thay vì `localhost`  
**Giải pháp:** Chỉ nhập hostname thuần túy: `localhost`

#### Vấn đề 3: Checkbox không hiển thị
**Nguyên nhân:** Dùng `size="invisible"`  
**Giải pháp:** Bỏ prop `size` để hiển thị checkbox

#### Vấn đề 4: Button bị disable mặc dù đã tick
**Nguyên nhân:** Logic check `USE_REAL_RECAPTCHA && !recaptchaToken`  
**Giải pháp:** Đổi thành check `!recaptchaToken` để bắt buộc mọi trường hợp

### 11. Cấu hình cuối cùng

#### Login.tsx & Register.tsx
```typescript
// Config
const RECAPTCHA_SITE_KEY = '6LdzFCUsAAAAACKng2zcYCnJRurAxsMOtlF4Qt5O'
const USE_REAL_RECAPTCHA = false

// Component
<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={RECAPTCHA_SITE_KEY}
  onChange={(token) => {
    setRecaptchaToken(token)
    setError('')
  }}
  onExpired={() => setRecaptchaToken(null)}
/>

// Validation
if (!recaptchaToken) {
  setError('Vui lòng xác nhận bạn không phải là robot!')
  return
}

// API Request
recaptchaToken: USE_REAL_RECAPTCHA ? recaptchaToken : 'TEST_BYPASS'
```

### 12. Checklist Production

Khi deploy production, cần:

- [ ] Đổi `USE_REAL_RECAPTCHA = true`
- [ ] Thay Site Key thật (nếu cần)
- [ ] Thêm domain production vào Google reCAPTCHA console
- [ ] Backend implement verify với Secret Key
- [ ] Test kỹ flow đăng ký/đăng nhập
- [ ] Monitor rate limit của Google reCAPTCHA

### 13. Tài liệu tham khảo

- Google reCAPTCHA Admin: https://www.google.com/recaptcha/admin
- reCAPTCHA Documentation: https://developers.google.com/recaptcha
- react-google-recaptcha: https://www.npmjs.com/package/react-google-recaptcha

---

## Kết quả

✅ reCAPTCHA đã được tích hợp vào Login và Register  
✅ Checkbox hiển thị và validation hoạt động  
✅ Backend nhận được recaptchaToken  
✅ Hỗ trợ cả test mode và production mode  
✅ Code clean, dễ bảo trì và mở rộng  

**Trạng thái hiện tại:** HOÀN THÀNH - Sẵn sàng cho development, cần backend verify cho production
