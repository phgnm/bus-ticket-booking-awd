import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Bus, LogOut, User, LayoutDashboard } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        // Glassmorphism Effect
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Bus className="h-6 w-6 text-indigo-600" />
                    VexereClone
                </Link>

                <nav className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            {user.role === 'admin' && (
                                <Link to="/admin/dashboard">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                            )}

                            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-slate-800 leading-none">
                                        {user.full_name || 'User'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                                        {user.role}
                                    </span>
                                </div>

                                {/* Nút Logout nhỏ gọn */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link to="/login">
                                <Button variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600">
                                    Đăng nhập
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all">
                                    Đăng ký ngay
                                </Button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}