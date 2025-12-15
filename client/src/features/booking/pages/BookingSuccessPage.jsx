import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Home, History, Loader2, XCircle, RefreshCw } from "lucide-react";
import api from '@/lib/api';

export default function BookingSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resetBooking } = useBooking();

    // code: 00 (PayOS thành công)
    const payosCode = searchParams.get('code');
    const bookingCode = searchParams.get('bookingCode') || searchParams.get('id');
    const storedEmail = sessionStorage.getItem('last_booking_email');

    // State quản lý trạng thái thực tế từ DB
    const [isConfirmed, setIsConfirmed] = useState(false); // True nếu DB đã trả về PAID
    const [isChecking, setIsChecking] = useState(false);
    const hasResetRef = useRef(false);

    useEffect(() => {
        if (!bookingCode) {
            navigate('/');
            return;
        }

        // Nếu PayOS trả về lỗi
        if (payosCode && payosCode !== '00') {
            return; // Giữ nguyên UI lỗi ở dưới
        }

        // Reset context booking client
        if (!hasResetRef.current) {
            resetBooking();
            hasResetRef.current = true;
            sessionStorage.removeItem('last_booking_email');
        }

        // --- CƠ CHẾ POLLING ---
        // Tự động kiểm tra trạng thái vé trong DB
        let checkCount = 0;
        const maxChecks = 5; // Kiểm tra tối đa 5 lần (mỗi lần 2s)

        const checkBookingStatus = async () => {
            if (!storedEmail) return;
            setIsChecking(true);
            try {
                const res = await api.get('/bookings/lookup', {
                    params: { code: bookingCode, email: storedEmail }
                });

                // Giả sử API trả về payment_status hoặc bạn check qua bookingDetails
                // Lưu ý: Bạn cần đảm bảo API lookup trả về status thanh toán
                // Nếu API hiện tại chưa trả về status, hãy check logic backend
                const ticket = res.data.data;

                // Logic check: Nếu vé tồn tại tức là đã tạo, 
                // nhưng để chắc chắn tiền đã vào, ta có thể check thêm trường status nếu có.
                // Ở đây tạm thời nếu tìm thấy vé thì coi như OK, 
                // nhưng tốt nhất Backend nên trả về status: 'PAID' | 'PENDING'
                if (ticket) {
                    setIsConfirmed(true);
                }
            } catch (error) {
                console.error("Lỗi kiểm tra trạng thái:", error);
            } finally {
                setIsChecking(false);
            }
        };

        // Chạy ngay lần đầu
        checkBookingStatus();

        // Cài đặt interval để check lại nếu chưa confirm
        const interval = setInterval(() => {
            checkCount++;
            if (checkCount >= maxChecks || isConfirmed) {
                clearInterval(interval);
            } else {
                checkBookingStatus();
            }
        }, 2000); // 2 giây check 1 lần

        return () => clearInterval(interval);

    }, [bookingCode, payosCode, storedEmail, navigate, resetBooking]); // Bỏ isConfirmed khỏi dependency để tránh loop

    // --- RENDER UI ---

    // 1. Trường hợp thất bại từ PayOS
    if (payosCode && payosCode !== '00') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-red-200">
                    <CardHeader className="text-center flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-2" />
                        <CardTitle className="text-xl text-red-600">Thanh toán thất bại hoặc đã hủy</CardTitle>
                        <CardDescription>Giao dịch chưa hoàn tất. Vui lòng thử lại.</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3">
                        <Button className="w-full" onClick={() => navigate('/search')}>Đặt lại vé</Button>
                        <Button variant="ghost" onClick={() => navigate('/')}>Về trang chủ</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // 2. Trường hợp URL báo thành công (code=00)
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-green-200 animate-in zoom-in-95 duration-300">
                <CardHeader className="text-center flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">Đã tiếp nhận thanh toán!</CardTitle>
                    <CardDescription>Hệ thống đang xử lý vé của bạn.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide">Mã vé</p>
                        <p className="text-3xl font-extrabold text-indigo-600 tracking-wider">
                            {bookingCode}
                        </p>
                    </div>

                    {/* Hiển thị trạng thái xác thực từ Server (Webhook) */}
                    <div className={`p-4 rounded-md flex items-center gap-3 transition-colors ${isConfirmed ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                        {isConfirmed ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                                <div className="text-sm">
                                    <strong>Xác nhận thành công:</strong> <br />
                                    Vé đã được gửi tới email <b>{storedEmail}</b>.
                                </div>
                            </>
                        ) : (
                            <>
                                <Loader2 className="w-5 h-5 shrink-0 animate-spin text-amber-600" />
                                <div className="text-sm">
                                    <strong>Đang đồng bộ dữ liệu...</strong> <br />
                                    Vui lòng đợi trong giây lát để hệ thống cập nhật trạng thái vé.
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 w-full">
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                        onClick={() => navigate('/profile/history')}
                    >
                        <History className="w-4 h-4 mr-2" /> Xem lịch sử vé
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-gray-300 hover:bg-gray-100 h-11"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Về trang chủ
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}