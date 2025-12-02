import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import TripSearchPage from '@/pages/TripSearchPage'; // [NEW] Import trang tìm kiếm
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
      <BrowserRouter>
        <Routes>
          {/* === PUBLIC ROUTES (Có Navbar) === */}
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
                  <Route path="/search" element={<TripSearchPage />} /> {/* [NEW] Route hiển thị nội dung */}
                </Routes>
              </main>
            </div>
          }>
            {/* Trick: Nested Routes này để render Navbar cho các trang con */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/search" element={<TripSearchPage />} /> {/* [NEW] Route giữ layout */}
          </Route>

          {/* === ADMIN ROUTES (Layout Riêng) === */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* Redirect /admin -> /admin/dashboard */}
              <Route index element={<Navigate to="/admin/dashboard" replace />} />

              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="buses" element={<BusManagement />} />
              <Route path="routes" element={<RouteManagement />} />
              <Route path="trips" element={<TripManagement />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;