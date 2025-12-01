import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Bus,
    Map,
    Compass,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        {
            title: 'Tổng quan',
            path: '/admin/dashboard',
            icon: LayoutDashboard
        },
        {
            title: 'Quản lý Xe',
            path: '/admin/buses',
            icon: Bus
        },
        {
            title: 'Quản lý Tuyến đường',
            path: '/admin/routes',
            icon: Map
        },
        {
            title: 'Quản lý Chuyến đi',
            path: '/admin/trips',
            icon: Compass
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
                    !isSidebarOpen && "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-center border-b border-slate-800">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Admin Portal
                    </h1>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:bg-red-950/30 hover:text-red-300"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        Đăng xuất
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center h-16 px-4 border-b bg-white">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X /> : <Menu />}
                    </Button>
                    <span className="ml-4 font-semibold">Menu</span>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}