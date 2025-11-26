# Bus Ticket Booking System - Assignment 1 Foundation

## 1. Tổng quan

Dự án này là nền tảng cho project cuối kỳ hệ thống Đặt vé xe buýt của môn Phát triển Ứng dụng Web nâng cao, tập trung vào việc thiết lập các chức năng cốt lõi: **Xác thực (Auth)**, **Phân quyền (RBAC)**, và **Design System** cho giao diện. Đây, ngoài là những bước nền tảng, còn là yêu cầu cần thiết cho bài tập G03 của môn

* **Kiến trúc:** Modular Monolith (Monorepo).
* **Backend (Server):** Node.js, Express.js, PostgreSQL, JWT, Google OAuth.
* **Frontend (Client):** React, Tailwind CSS.
* **Điểm nhấn:** Tuân thủ chuẩn Flat Config cho ESLint và triển khai RBAC từ token.

---

## 2. Setup và Deploy local

### 2.1 FRONTEND

### 2.2 BACKEND

#### 2.2.1. Yêu cầu phần mềm
* [ ] Docker và Docker Compose
* [ ] Node.js (v18+)

#### 2.2.2. Khởi tạo cho Backend
1.  **Cài đặt Dependencies:** Chạy `npm install` ở thư mục gốc (cho Husky), sau đó vào `cd server` và `npm install` để cài đặt các thư viện cho Backend.
2.  **Cấu hình Environment:** Tạo file `.env` ở thư mục `server/` và điền các biến sau:
    ```env
    # Core Server
    PORT=5000
    JWT_SECRET=CREATE_JWT_SECRET_KEY_HERE

    # Database (Docker)
    POSTGRES_PASSWORD=@BusTicket123 
    
    # Google OAuth
    GOOGLE_CLIENT_ID=CREATE_GOOGLE_CLIENT_ID_HERE
    ```
3.  **Khởi động Infrastructure:**
    ```bash
    docker-compose up -d
    ```
4.  **Tạo Schema DB:** Chạy nội dung file `server/src/models/init.sql` vào database `bus_ticket_dev` (qua pgAdmin hoặc psql).
5.  **Khởi động Server (Backend):**
    ```bash
    cd server
    npm run dev
    ```

---

## 3. Thiết kế cho Frontend

### 3.1. Công nghệ sử dụng (Tech Stack)
Build Tool: **Vite** – Giúp khởi tạo và build dự án React nhanh chóng.

Styling: **Tailwind CSS** – Framework CSS utility-first.

UI Components: **Shadcn UI** – Bộ component tái sử dụng, tùy chỉnh cao dựa trên Radix UI (Button, Input, Card, Dropdown...).

Routing: **React Router DOM (v6+)** – Quản lý điều hướng trang.

HTTP Client: **Axios** – Gửi request tới Backend.

Animation: **Framer Motion** – Tạo hiệu ứng chuyển động mượt mà.

Icons: **Lucide React**.

### 3.2. Kiến trúc thư mục (Project Structure)
Cấu trúc thư mục `client/src` được tổ chức theo chức năng:

- `components/ui/`: Chứa các thành phần giao diện cơ sở (Base Components) từ Shadcn UI.
- `components/`: Chứa các thành phần chức năng chung (Navbar, ProtectedRoute...).
- `pages/`: Chứa các trang chính (HomePage, LoginPage, RegisterPage, AdminDashboard).
- `context/`: Quản lý Global State với AuthContext.
- `lib/`: Chứa cấu hình và tiện ích (api.js với Axios interceptors).

### 3.3. Luồng xử lý dữ liệu & Bảo mật (Logic Flow)
- **Authentication State:** Sử dụng Context API để lưu và đồng bộ user + token với localStorage.
- **API Interceptor:** Tự động đính kèm JWT vào header Authorization cho mọi request.
- **Protected Routes:** Kiểm tra login + role để bảo vệ trang nhạy cảm.

### 3.4. Thiết kế giao diện (UI/UX)
- **Responsive:** Tương thích mobile & desktop nhờ Tailwind.
- **Visual Effects:** Dùng Glassmorphism + Framer Motion cho hiệu ứng mượt.
- **Form Handling:** Form đăng nhập/đăng ký thủ công kèm validation cơ bản.



## 4. Thiết kế cho Backend

### 4.1. Authentication Flow
* **Cơ chế Token:** Sử dụng **JWT Access Token** (TTL 1 giờ). JWT được chọn vì tính **phi trạng thái (Stateless)**, phù hợp cho kiến trúc microservices (nếu mở rộng sau này).
* **Social Login (Google):** Frontend gửi ID Token. Backend sử dụng **Google Auth Library** để xác minh token, sau đó tạo hoặc cập nhật user trong DB (dùng cột `google_id`) và cấp JWT.

### 4.2. Authorization (RBAC) Implementation
* **Role Definition:** Cột `role` trong bảng `users` được sử dụng để định danh quyền hạn (`admin` hoặc `user`). Role này được nhúng vào Payload của JWT.
* **Server-Side Enforcement:** Middleware **`authorizeRoles()`** được áp dụng trên các route riêng tư (`/api/admin/stats`). Middleware đọc role từ JWT (`req.user.role`) và trả về **403 Forbidden** nếu user không có quyền. Ngoài ra Middleware cũng trả về **403 Forbidden** khi visitor (khách chưa login) cố truy cập vào route chỉ dành cho người dùng (`/api/user/history`)
* **Trade-off/Decision:**
    * **Access Token Storage:** Frontend sẽ chịu trách nhiệm lưu trữ Access Token (ví dụ: trong Local Storage hoặc HttpOnly Cookie) và gửi kèm trong header `Authorization: Bearer <token>`.
    * **No Refresh Token (Yet):** Trong Assignment 1, Refresh Token chưa được triển khai. Nếu triển khai, Refresh Token sẽ được lưu trữ trong HttpOnly Cookie để chống XSS.

---

## 5. Tooling & Quality

* **ESLint (v9 Flat Config):** Sử dụng `eslint.config.js` để kiểm tra chất lượng code và tuân thủ chuẩn mới nhất.
* **Prettier:** Đảm bảo định dạng code nhất quán.
* **Husky & lint-staged:** Chạy `npm run format` và `npm run lint` tự động trên các file đã `git add` trước khi `commit`.
* **Testing:** Sử dụng **Jest/Supertest** để kiểm tra Unit Test cho các Middleware và Controller.