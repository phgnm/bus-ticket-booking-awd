import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext'; // Import Context

import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import TripSearchPage from '@/pages/TripSearchPage';

// Import các trang mới cho Booking & Vé
import BookingPage from '@/pages/BookingPage';
import BookingSuccessPage from '@/pages/BookingSuccessPage';
import LookupTicketPage from '@/pages/LookupTicketPage';
import TicketHistoryPage from '@/pages/TicketHistoryPage';

import ProtectedRoute from '@/components/ProtectedRoute';

// Admin Components
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import BusManagement from '@/pages/admin/BusManagement';
import RouteManagement from '@/pages/admin/RouteManagement';
import TripManagement from '@/pages/admin/TripManagement';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BookingProvider> {/* Bọc BookingProvider ở ngoài cùng hoặc dưới AuthProvider */}
        <BrowserRouter>
          <Routes>
            {/* === PUBLIC ROUTES (Có Navbar) === */}
            {/* GIỮ NGUYÊN LOGIC CŨ: Định nghĩa Routes con ngay trong element của Layout */}
            <Route element={
              <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/search" element={<TripSearchPage />} />

                    {/* --- CÁC ROUTE MỚI (Phải khai báo ở đây để hiển thị nội dung) --- */}
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/booking-success" element={<BookingSuccessPage />} />
                    <Route path="/lookup-ticket" element={<LookupTicketPage />} />

                    {/* Route cần đăng nhập (Lịch sử vé) */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/profile/history" element={<TicketHistoryPage />} />
                    </Route>
                  </Routes>
                </main>
              </div>
            }>
              {/* Trick: Nested Routes để render Layout (Khai báo lại để Router khớp path cha) */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/search" element={<TripSearchPage />} />

              {/* --- CÁC ROUTE MỚI (Khai báo lại ở đây để giữ Layout) --- */}
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking-success" element={<BookingSuccessPage />} />
              <Route path="/lookup-ticket" element={<LookupTicketPage />} />
              <Route path="/profile/history" element={<TicketHistoryPage />} />
            </Route>

            {/* === ADMIN ROUTES (Layout Riêng) === */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="buses" element={<BusManagement />} />
                <Route path="routes" element={<RouteManagement />} />
                <Route path="trips" element={<TripManagement />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;