## I. Nhiệm vụ của Frontend (Assignment 1 Completion)

Frontend cần hoàn thành các nhiệm vụ sau để Assignment G03 được nộp thành công:

1.  **Design System:** Hoàn thiện Global Theme (Colors, Typography) và các Reusable Components (AppShell, Card, Button, FormField).
2.  **Authorization UI:** Triển khai **Route Guards** để bảo vệ route Admin và **UI Hiding** để ẩn các widget không cần thiết (Ví dụ: user thường không thấy báo cáo doanh thu).
3.  **Dashboard Widgets:** Tích hợp API Mock Data sau để vẽ Dashboard (biểu đồ, list):
    * `GET /api/admin/stats` (Dành cho Admin)
    * `GET /api/user/history` (Dành cho User/Admin)
4.  **Deployment:** Deploy Client lên **Vercel** hoặc **Netlify** và cung cấp Live URL.

---

## II. Kế hoạch cho Final Project (Assignment 2 & 3)

### 1. Epic Core (Trip Search & Booking)
* [ ] **Database:** Triển khai Schema cho **Route**, **Trip**, **Bus**, và **Seat Status**.
* [ ] **API Logic:** Xây dựng API **Trip Search** (`GET /trips/search`) và API CRUD cho Admin (Route/Bus/Trip).
* [ ] **Concurrency:** Tích hợp **Redis** để quản lý **Seat Locking** (khóa ghế tạm thời khi user chuẩn bị thanh toán).

### 2. Enhancement
* [ ] **Payment:** Tích hợp Payment Gateway Sandbox (MoMo/PayOS) và xử lý Webhook.
* [ ] **Notification:** Triển khai Email Notifications (Confirmation, Reminders).