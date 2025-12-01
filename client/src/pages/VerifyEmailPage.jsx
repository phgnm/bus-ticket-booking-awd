import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token xác thực không hợp lệ hoặc bị thiếu.');
            return;
        }

        const verify = async () => {
            try {
                // Gọi API backend: /auth/verify-email?token=...
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.msg || 'Kích hoạt tài khoản thành công!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.msg || 'Xác thực thất bại. Link có thể đã hết hạn.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">Xác thực Email</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-6 text-center">

                    {/* Trạng thái Loading */}
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                            <p className="text-muted-foreground">{message}</p>
                        </>
                    )}

                    {/* Trạng thái Thành công */}
                    {status === 'success' && (
                        <>
                            <div className="p-4 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-green-700">Thành công!</h3>
                                <p className="text-slate-600">{message}</p>
                            </div>
                            <Link to="/login" className="w-full">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Đăng nhập ngay
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Trạng thái Lỗi */}
                    {status === 'error' && (
                        <>
                            <div className="p-4 bg-red-100 rounded-full">
                                <XCircle className="h-16 w-16 text-red-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-red-700">Lỗi xác thực</h3>
                                <p className="text-slate-600">{message}</p>
                            </div>
                            <Link to="/" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Về trang chủ
                                </Button>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}