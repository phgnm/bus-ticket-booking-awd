import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="text-xl font-bold text-primary">
                    VexereClone
                </Link>

                <nav className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-sm text-muted-foreground">
                                Xin chào, <strong>{user.full_name || user.email}</strong>
                            </span>
                            {user.role === 'admin' && (
                                <Link to="/admin/dashboard">
                                    <Button variant="outline" size="sm">Dashboard</Button>
                                </Link>
                            )}
                            <Button variant="ghost" size="sm" onClick={logout}>
                                Đăng xuất
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Đăng nhập</Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="ghost" size="sm">Đăng ký</Button>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}