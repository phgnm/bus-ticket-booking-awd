import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { BusFront } from 'lucide-react';

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
            if (user.role === 'admin') navigate('/admin/dashboard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng nhập thất bại');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post('/auth/google-login', { idToken: credentialResponse.credential });
            const { token, user } = res.data;
            login(token, user);
            if (user.role === 'admin') navigate('/admin/dashboard');
            else navigate('/');
        } catch (err) {
            console.error(err);
            setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-[800px]">
            {/* Cột trái: Trang trí */}
            <div className="hidden bg-muted lg:block relative h-full overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
                <div className="relative z-20 flex items-center text-lg font-medium text-white p-10">
                    <BusFront className="mr-2 h-6 w-6" />
                    VexereClone Inc
                </div>
                <div className="relative z-20 mt-auto flex flex-col justify-center h-full px-10">
                    <blockquote className="space-y-2 text-white">
                        <p className="text-4xl font-bold leading-tight">
                            "Hành trình vạn dặm bắt đầu từ một tấm vé."
                        </p>
                        <p className="text-lg opacity-80">- Khám phá mọi nẻo đường Việt Nam</p>
                    </blockquote>
                </div>
            </div>

            {/* Cột phải: Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto grid w-full max-w-[400px] gap-6"
                >
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Chào mừng trở lại</h1>
                        <p className="text-balance text-muted-foreground">
                            Nhập email của bạn để đăng nhập vào tài khoản
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="h-11"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mật khẩu</Label>
                                {/* [UPDATED] Link đến trang quên mật khẩu */}
                                <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="text-sm text-red-500 bg-red-50 p-2 rounded text-center border border-red-200"
                            >
                                {error}
                            </motion.div>
                        )}

                        <Button type="submit" className="w-full h-11 text-md shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0">
                            Đăng nhập
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Hoặc tiếp tục với
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Đăng nhập Google thất bại')}
                            useOneTap={false} // [UPDATED] Tắt OneTap để tránh lỗi FedCM ở dev mode
                            theme="outline"
                            size="large"
                            width="100%"
                            shape="pill"
                        />
                    </div>

                    <div className="mt-4 text-center text-sm">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                            Đăng ký ngay
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}