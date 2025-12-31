import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';

import HomePage from '@/features/home/pages/HomePage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import TripSearchPage from '@/features/booking/pages/TripSearchPage';

// Import Booking Pages
import BookingPage from '@/features/booking/pages/BookingPage';
import BookingSuccessPage from '@/features/booking/pages/BookingSuccessPage';
import BookingFailedPage from '@/features/booking/pages/BookingFailedPage'; // <--- IMPORT MỚI
import LookupTicketPage from '@/features/booking/pages/LookupTicketPage';
import TicketHistoryPage from '@/features/booking/pages/TicketHistoryPage';

import ProtectedRoute from '@/components/ProtectedRoute';

// Admin Components
import AdminLayout from '@/components/shared/AdminLayout';
// User Layout
import UserLayout from '@/components/shared/UserLayout';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import BusManagement from '@/features/admin/pages/BusManagement';
import RouteManagement from '@/features/admin/pages/RouteManagement';
import TripManagement from '@/features/admin/pages/TripManagement';
import ReviewManagement from '@/features/admin/pages/ReviewManagement';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <Routes>
            {/* === USER ROUTES (Có Navbar + Theme riêng) === */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/search" element={<TripSearchPage />} />

              {/* Booking Routes */}
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking-success" element={<BookingSuccessPage />} />
              <Route path="/booking-failed" element={<BookingFailedPage />} />
              <Route path="/lookup-ticket" element={<LookupTicketPage />} />

              {/* Private User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile/history" element={<TicketHistoryPage />} />
              </Route>
            </Route>

            {/* === ADMIN ROUTES === */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="buses" element={<BusManagement />} />
                <Route path="routes" element={<RouteManagement />} />
                <Route path="trips" element={<TripManagement />} />
                <Route path="reviews" element={<ReviewManagement />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;