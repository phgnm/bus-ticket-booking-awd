import { useEffect, useState, useRef } from 'react'; // [UPDATED] Import useRef
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const token = searchParams.get('token');
    const email = location.state?.email;

    const [status, setStatus] = useState(token ? 'loading' : 'pending');
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');

    // [UPDATED] Sử dụng useRef để chặn việc gọi API 2 lần trong Strict Mode
    const verifyCalled = useRef(false);

    useEffect(() => {
        // Case 1: Vừa đăng ký xong, chưa có token
        if (!token) {
            setStatus('pending');
            return;
        }

        // [UPDATED] Nếu đã gọi API rồi thì không gọi lại nữa
        if (verifyCalled.current) return;
        verifyCalled.current = true;

        // Case 2: Có token, gọi API xác thực
        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.msg || 'Kích hoạt tài khoản thành công!');
            } catch (err) {
                setStatus('error');
                // Nếu lỗi là do đã kích hoạt rồi thì hiển thị thông báo nhẹ nhàng hơn (tùy chọn)
                setMessage(err.response?.data?.msg || 'Xác thực thất bại. Link có thể đã hết hạn.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">
                        {status === 'pending' ? 'Kiểm tra hộp thư' : 'Xác thực Email'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-6 text-center">

                    {/* Trạng thái 1: Chờ check mail */}
                    {status === 'pending' && (
                        <>
                            <div className="p-4 bg-blue-100 rounded-full">
                                <Mail className="h-16 w-16 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-slate-800">Đăng ký thành công!</h3>
                                <p className="text-slate-600">
                                    Chúng tôi đã gửi link xác thực đến
                                    {email ? <span className="font-semibold text-slate-900"> {email}</span> : ' email của bạn'}.
                                    <br />Vui lòng kiểm tra hộp thư (kể cả mục spam).
                                </p>
                            </div>
                            <Link to="/login" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Quay lại đăng nhập
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Trạng thái 2: Đang xử lý (Loading) */}
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                            <p className="text-muted-foreground">{message}</p>
                        </>
                    )}

                    {/* Trạng thái 3: Thành công */}
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

                    {/* Trạng thái 4: Lỗi */}
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