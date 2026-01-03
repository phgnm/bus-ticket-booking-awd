import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Home, History, Loader2, XCircle, AlertTriangle } from "lucide-react";
import api from '@/lib/api';

export default function BookingSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resetBooking } = useBooking();

    const [status, setStatus] = useState('loading'); // loading | success | failed
    const [bookingDetails, setBookingDetails] = useState(null);
    const hasResetRef = useRef(false);

    // 1. Lấy thông tin từ URL trả về
    // code: Mã lỗi của PayOS (00 = Thành công)
    // bookingCode: Mã vé của hệ thống mình (đã sửa ở bước trước)
    const payosCode = searchParams.get('code');
    const bookingCode = searchParams.get('bookingCode') || searchParams.get('id'); // Fallback nếu thiếu
    const storedEmail = sessionStorage.getItem('last_booking_email');

    useEffect(() => {
        // Nếu không có mã booking, đá về trang chủ
        if (!bookingCode) {
            navigate('/');
            return;
        }

        // --- LOGIC QUAN TRỌNG: TIN TƯỞNG URL (CLIENT-SIDE) ---
        // Thay vì chờ DB (Webhook), ta kiểm tra ngay mã trả về của PayOS
        if (payosCode === '00') {
            setStatus('success');

            // Reset context booking ngay lập tức để user không bị lưu session cũ
            if (!hasResetRef.current) {
                resetBooking();
                hasResetRef.current = true;
                sessionStorage.removeItem('last_booking_email');
            }

            // Vẫn gọi API lookup để lấy thông tin vé hiển thị (Tên, ghế, giờ đi...)
            // Nhưng KHÔNG dùng status của API để quyết định hiển thị UI (vì DB có thể chưa kịp cập nhật)
            if (storedEmail) {
                api.get('/bookings/lookup', { params: { code: bookingCode, email: storedEmail } })
                    .then(res => {
                        if (res.data.data) {
                            setBookingDetails(res.data.data);
                        }
                    })
                    .catch(console.error);
            }

        } else if (payosCode && payosCode !== '00') {
            // PayOS trả về lỗi (ví dụ: Hủy thanh toán, lỗi thẻ...)
            setStatus('failed');
        } else {
            // Trường hợp URL không có code của PayOS (User tự gõ link vào?)
            // Lúc này mới cần Polling check DB như cũ
            setStatus('loading');
            // ... Logic polling cũ nếu cần, nhưng với flow redirect thì ít khi vào đây
        }

    }, [payosCode, bookingCode, navigate, resetBooking, storedEmail]);

    // --- RENDER UI ---

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-muted-foreground font-medium">Đang kiểm tra kết quả...</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <Card className="w-full max-w-md shadow-lg border-red-200">
                    <CardHeader className="text-center flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-2" />
                        <CardTitle className="text-xl text-red-600">Thanh toán thất bại hoặc đã hủy</CardTitle>
                        <CardDescription>Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3">
                        <Button className="w-full" onClick={() => navigate('/')}>Về trang chủ</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Màn hình SUCCESS
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-green-200 animate-in zoom-in-95 duration-300">
                <CardHeader className="text-center flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">Đặt vé thành công!</CardTitle>
                    <CardDescription>Cảm ơn bạn đã sử dụng dịch vụ.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-card p-6 rounded-lg border border-dashed text-center">
                        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">Mã vé của bạn</p>
                        <p className="text-3xl font-extrabold text-indigo-600 tracking-wider">
                            {bookingCode}
                        </p>
                    </div>

                    {/* Cảnh báo nhẹ nếu DB chưa cập nhật (do localhost) */}
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-xs text-amber-800 flex items-start gap-2 text-left">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            Vé điện tử đang được tạo và sẽ gửi tới email: <b>{storedEmail}</b>.
                            <br />
                            Nếu trạng thái trong "Lịch sử vé" vẫn là "Chờ thanh toán", vui lòng chờ ít phút để hệ thống cập nhật.
                        </div>
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
                        className="w-full border-border hover:bg-accent h-11"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Về trang chủ
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}