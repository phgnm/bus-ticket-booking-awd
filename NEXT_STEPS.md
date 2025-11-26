

## II. Kế hoạch cho Final Project (Assignment 2 & 3)

### 1. Assignment 2: Core Features (Quản lý Chuyến xe & Đặt vé)
Trọng tâm: Hoàn thiện luồng nghiệp vụ chính từ tìm kiếm → chọn ghế → đặt vé.

#### 1.1. Database & Models (PostgreSQL)
- [ ] **Schema Design:** Thiết kế & triển khai ERD cho:
  - **Bus:** Biển số, loại xe, số ghế, sơ đồ ghế.
  - **Route:** Điểm đi, điểm đến, thời gian dự kiến.
  - **Trip:** Liên kết Bus & Route, giờ khởi hành, giá vé.
  - **Booking:** Đơn đặt vé (User, Trip, tổng tiền, trạng thái).
  - **Ticket:** Chi tiết vé (mã ghế, thông tin hành khách).
- [ ] **Migration & Seeding:** Seed các tuyến phổ biến (Sài Gòn – Đà Lạt, Sài Gòn – Vũng Tàu…).

#### 1.2. Backend API Implementation
- [ ] **Public Trip API**
  - `GET /api/trips`: Tìm kiếm chuyến (lọc theo ngày, tuyến, giá…)
  - `GET /api/trips/:id`: Lấy chi tiết + trạng thái ghế.
- [ ] **Booking API**
  - `POST /api/bookings`: Tạo booking + giữ ghế tạm thời.
  - `POST /api/bookings/cancel`: Hủy booking.
- [ ] **Admin API**
  - CRUD Route / Bus / Trip.

#### 1.3. Frontend Implementation
- [ ] **Trip Search Page**
- [ ] **Seat Selection UI** (Sơ đồ ghế trực quan)
- [ ] **Booking History** (Lịch sử đặt vé)

---

### 2. Assignment 3: Advanced Features & System Completion
Trọng tâm: Concurrency – Payment – Background Jobs.

#### 2.1. Concurrency Control
- [ ] **Redis Seat Locking:** Khóa ghế tạm thời để tránh 2 user đặt cùng lúc.
- [ ] **Transaction Management:** Đảm bảo Booking + Ticket tạo trong cùng transaction.

#### 2.2. Payment Integration
- [ ] **Payment Gateway:** Tích hợp MoMo / VNPAY / PayOS (Sandbox).
- [ ] **Webhook:** Cập nhật trạng thái (Pending → Paid).

#### 2.3. Background Services & Notifications
- [ ] **Email Automation:** Gửi e-ticket sau thanh toán.
- [ ] **Cron Job:** Tự hủy booking pending quá 10 phút.

#### 2.4. Testing & Deployment
- [ ] **Unit/Integration Test:** Booking flow, concurrency.
- [ ] **Docker Compose:** Chạy full stack (App + DB + Redis).
- [ ] **Final Deploy:** Render / Vercel / Railway.


### 1. Epic Core (Trip Search & Booking)
* [ ] **Database:** Triển khai Schema cho **Route**, **Trip**, **Bus**, và **Seat Status**.
* [ ] **API Logic:** Xây dựng API **Trip Search** (`GET /trips/search`) và API CRUD cho Admin (Route/Bus/Trip).
* [ ] **Concurrency:** Tích hợp **Redis** để quản lý **Seat Locking** (khóa ghế tạm thời khi user chuẩn bị thanh toán).

### 2. Enhancement
* [ ] **Payment:** Tích hợp Payment Gateway Sandbox (MoMo/PayOS) và xử lý Webhook.
* [ ] **Notification:** Triển khai Email Notifications (Confirmation, Reminders).