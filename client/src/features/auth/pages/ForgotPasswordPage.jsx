import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(res.data.msg);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.msg || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-lg border-slate-200">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-slate-800">Quên mật khẩu?</CardTitle>
                        <CardDescription>
                            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'success' ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Đã gửi email!</h3>
                                    <p className="text-sm text-slate-600">{message}</p>
                                </div>
                                <Button variant="outline" className="w-full mt-4" onClick={() => setStatus('idle')}>
                                    Gửi lại (nếu chưa nhận được)
                                </Button>
                                <Link to="/login" className="block text-sm text-indigo-600 hover:underline mt-4">
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email đăng ký</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-9 h-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                                        {message}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                                    ) : (
                                        'Gửi liên kết'
                                    )}
                                </Button>

                                <div className="text-center mt-4">
                                    <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}