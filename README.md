# Bus Ticket Booking System - Final Integrated Version

## 1. Tổng quan
Dự án là một hệ thống đặt vé xe buýt toàn diện, tập trung vào việc giải quyết các bài toán thực tế về hiệu năng, tính sẵn sàng và trải nghiệm người dùng thông qua các công nghệ hiện đại.

* **Kiến trúc:** Modular Monolith (Monorepo).
* **Backend (Server):** Node.js, Express.js, PostgreSQL.
* **Caching & Concurrency:** Redis (Seat Locking & Search Caching).
* **Frontend (Client):** React, Tailwind CSS, Shadcn UI.
* **AI Integration:** Google Gemini AI (Natural Language Trip Search).
* **Payment:** PayOS Gateway.

---

## 2. Các tính năng nâng cao (Advanced Features)

### 🤖 Hệ thống AI Chatbot
* Tích hợp **Google Gemini AI** để hỗ trợ người dùng tìm kiếm chuyến xe bằng ngôn ngữ tự nhiên.
* Sử dụng bộ Alias địa danh để xử lý các tên gọi không chuẩn (VD: Sài Gòn -> TP. Hồ Chí Minh).

### 🔒 Cơ chế Giữ chỗ & Fail-safe Redis
* **Real-time Locking:** Sử dụng Redis để giữ ghế trong 10 phút khi đang thanh toán.

### 💳 Thanh toán & Tự động hóa
* **Thanh toán trực tuyến:** Tích hợp **PayOS**, tự động xác nhận giao dịch và cập nhật trạng thái vé.
* **Hoàn tiền tự động:** Chính sách hoàn tiền 90% khi hủy vé trước 24 giờ.
* **Cron Job:** Hệ thống tự động quét và giải phóng các ghế hết hạn thanh toán mỗi phút.

---

## 3. Setup và Deploy local

### 3.1 FRONTEND (`/client`)
1.  **Cài đặt:** `npm install`.
2.  **Cấu hình Environment:** Tạo `.env` với:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
3.  **Khởi động:** `npm run dev`.

### 3.2 BACKEND (`/server`)
1.  **Cài đặt:** `npm install`.
2.  **Cấu hình Environment:** Tạo `.env` với:
    ```env
    PORT=5000
    DATABASE_URL=postgres://postgres:@BusTicket123@localhost:5432/bus_ticket_dev
    REDIS_URL=redis://localhost:6379
    JWT_ACCESS_SECRET=your_secret_key
    GEMINI_API_KEY=your_key
    PAYOS_CLIENT_ID=...
    PAYOS_API_KEY=...
    PAYOS_CHECKSUM_KEY=...
    ```
3.  **Khởi động Infrastructure:** `docker-compose up -d`.
4.  **Khởi động Server:** `npm run dev` (Hệ thống sẽ tự động seed dữ liệu Admin nếu DB trống).

---

## 4. Thiết kế hệ thống

### 4.1. Backend Architecture
* **Service-Repository Pattern:** Tách biệt logic xử lý (Services) và truy vấn dữ liệu (Repositories) để dễ dàng kiểm thử và bảo trì.
* **API Documentation:** Tích hợp **Swagger UI** tại route `/api/docs`.
* **Email Service:** Tự động gửi vé điện tử (PDF đính kèm) sau khi thanh toán thành công.

### 4.2. Quản trị (Admin Dashboard)
* Thống kê doanh thu, số lượng đánh giá và điểm xếp hạng trung bình.
* Quản lý toàn diện: Xe buýt, Tuyến đường, Chuyến đi và Đánh giá người dùng.

---

## 5. Tooling & Quality
* **ESLint & Prettier:** Đảm bảo chất lượng code và định dạng nhất quán.
* **Husky:** Tự động kiểm tra code trước khi commit.
* **CI/CD:** Triển khai tự động qua **GitHub Actions** lên Vercel.
* **Testing:** Unit & Integration tests sử dụng **Jest** và **Supertest**.

---