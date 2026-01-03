import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Bus, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate(); // Hook chuyển hướng

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp');
        }

        try {
            await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name
            });

            // Chuyển hướng sang trang VerifyEmail và gửi kèm email để hiển thị
            navigate('/verify-email', { state: { email: formData.email } });

        } catch (err) {
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                setError(err.response.data.errors.join(', '));
            } else {
                setError(err.response?.data?.msg || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        }
    };

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-[800px]">
            {/* Cột trái: Giữ nguyên */}
            <div className="hidden bg-muted lg:block relative h-full overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="relative z-20 flex items-center text-lg font-medium text-white p-10">
                    <Bus className="mr-2 h-6 w-6" />
                    BusGo
                </div>

                <div className="relative z-20 mt-auto flex flex-col justify-center h-full px-10 text-white">
                    <div className="space-y-4 max-w-lg">
                        <h2 className="text-4xl font-bold tracking-tight">Tham gia cộng đồng du lịch lớn nhất Việt Nam</h2>
                        <ul className="space-y-3 mt-6">
                            <li className="flex items-center gap-2 text-lg text-zinc-300">
                                <CheckCircle2 className="h-5 w-5 text-green-400" /> Đặt vé nhanh chóng, tiện lợi
                            </li>
                            <li className="flex items-center gap-2 text-lg text-zinc-300">
                                <CheckCircle2 className="h-5 w-5 text-green-400" /> Ưu đãi độc quyền cho thành viên
                            </li>
                            <li className="flex items-center gap-2 text-lg text-zinc-300">
                                <CheckCircle2 className="h-5 w-5 text-green-400" /> Hỗ trợ khách hàng 24/7
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Cột phải: Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto grid w-full max-w-[450px] gap-6"
                >
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Tạo tài khoản mới</h1>
                        <p className="text-balance text-muted-foreground">
                            Nhập thông tin cá nhân của bạn để bắt đầu
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Họ và tên</Label>
                            <Input id="full_name" required value={formData.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com" className="h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="h-11 pr-10"
                                        style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Xác nhận</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="h-11 pr-10"
                                        style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-sm text-red-500 text-center bg-red-50 py-2 rounded border border-red-100"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button type="submit" className="w-full h-11 text-md font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all">
                            Đăng ký tài khoản
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}