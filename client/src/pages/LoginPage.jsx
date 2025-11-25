import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, user } = res.data;

            login(token, user);

            // Redirect logic
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng nhập thất bại');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault(); // Ngăn chặn chuyển hướng của thẻ Link
        alert("Chức năng đang phát triển, vui lòng liên hệ Admin");
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Đăng nhập</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mật khẩu</Label>


                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <Button type="submit" className="w-full">Đăng nhập</Button>
                        <div className='text-right'>
                            <Link
                            to="#"
                            onClick={handleForgotPassword}
                            className="text-xs text-primary hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                        </div>
                        
                    </form>

                    <div className="mt-4">
                        <Button variant="outline" className="w-full" type="button">
                            Đăng nhập với Google
                        </Button>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        Chưa có tài khoản? <Link to="/register" className="text-primary hover:underline">Đăng ký ngay</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}