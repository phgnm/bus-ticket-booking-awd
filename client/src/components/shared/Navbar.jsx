import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ModeToggle } from "@/components/mode-toggle"
import { Bus, LogOut, User, LayoutDashboard, Search, History } from 'lucide-react'; // [NEW] Thêm icon History
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
    const location = useLocation();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-6">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    <Bus className="h-6 w-6 text-primary" />
                    BusGo
                </Link>

                <nav className="flex items-center gap-4">
                    <ModeToggle />
                    {/* Nút Tra cứu vé (Guest) */}
                    <Link to="/lookup-ticket">
                        <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium hidden md:flex">
                            <Search className="w-4 h-4" />
                            Tra cứu vé
                        </Button>
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-3">
                            {/* [NEW] Nút Lịch sử vé (User) */}
                            <Link to="/profile/history">
                                <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium hidden md:flex">
                                    <History className="w-4 h-4" />
                                    Lịch sử vé
                                </Button>
                            </Link>

                            {user.role === 'admin' && (
                                <Link to="/admin/dashboard">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                            )}

                            <div className="flex items-center gap-2 pl-4 border-l border-border">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-foreground leading-none">
                                        {user.full_name || 'User'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                        {user.role}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-full"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        !isAuthPage && (
                            <div className="flex gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                                        Đăng ký ngay
                                    </Button>
                                </Link>
                            </div>
                        )
                    )}
                </nav>
            </div>
        </header>
    );
}