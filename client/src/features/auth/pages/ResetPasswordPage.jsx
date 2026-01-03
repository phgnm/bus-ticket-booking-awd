import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token không hợp lệ hoặc đường dẫn bị lỗi.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus('error');
            setMessage('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setStatus('error');
            setMessage('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: formData.newPassword
            });
            setStatus('success');
            // Tự động chuyển hướng sau 3 giây (tùy chọn)
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.msg || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 py-8">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <p className="text-slate-700 font-medium">Đường dẫn không hợp lệ.</p>
                        <Link to="/"><Button variant="outline">Về trang chủ</Button></Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-lg border-slate-200">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-slate-800">Đặt lại mật khẩu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {status === 'success' ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Thành công!</h3>
                                <p className="text-slate-600">Mật khẩu của bạn đã được cập nhật.</p>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/login')}>
                                    Đăng nhập ngay
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="••••••"
                                            className="pl-9 pr-10 h-10"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            required
                                            style={{ WebkitTextSecurity: showNewPassword ? 'none' : 'disc' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••"
                                            className="pl-9 pr-10 h-10"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
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

                                {status === 'error' && (
                                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200 text-center">
                                        {message}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...</>
                                    ) : (
                                        'Đổi mật khẩu'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}