import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Bus,
    Map,
    CalendarDays,
    LogOut,
    Menu,
    MessageSquare // Thêm icon MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Định nghĩa các mục menu, thêm mục "Đánh giá"
    const menuItems = [
        { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/admin/buses', label: 'Quản lý xe', icon: Bus },
        { path: '/admin/routes', label: 'Tuyến đường', icon: Map },
        { path: '/admin/trips', label: 'Lịch trình', icon: CalendarDays },
        { path: '/admin/reviews', label: 'Đánh giá', icon: MessageSquare }, // Item mới
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <ThemeProvider defaultTheme="system" storageKey="admin-ui-theme">
            <div className="min-h-screen bg-background flex">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        {/* Sidebar Header / Logo */}
                        <div className="h-16 flex items-center px-6 border-b border-border">
                            <Bus className="w-6 h-6 text-primary mr-2" />
                            <span className="text-lg font-bold text-foreground px-3">Admin Portal</span>
                            <ModeToggle />
                        </div>


                        {/* Navigation Links */}
                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                // Kiểm tra active state (bao gồm cả sub-routes)
                                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3 shrink-0">
                                    {user?.full_name?.[0] || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {user?.full_name || 'Admin User'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-200">
                    {/* Mobile Header */}
                    <header className="h-16 bg-card border-b border-border lg:hidden flex items-center justify-between px-4 sticky top-0 z-30">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6 text-muted-foreground" />
                        </Button>
                        <span className="font-semibold text-foreground">Admin Portal</span>
                        <div className="w-10" /> {/* Spacer để cân giữa title */}
                    </header>

                    <main className="flex-1 p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}