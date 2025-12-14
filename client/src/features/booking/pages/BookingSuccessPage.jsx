import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Home, History } from "lucide-react";

export default function BookingSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resetBooking } = useBooking(); // Lấy hàm reset từ Context

    // Lấy mã booking_code từ URL
    const bookingCode = searchParams.get('code');

    useEffect(() => {
        // Reset dữ liệu booking trong context khi vào trang thành công
        resetBooking();
    }, [resetBooking]);

    if (!bookingCode) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Button onClick={() => navigate('/')}>Về trang chủ</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-green-200 animate-in zoom-in-95 duration-300">
                <CardHeader className="text-center flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">Thanh toán thành công!</CardTitle>
                    <CardDescription>
                        Chúc mừng bạn đã đặt vé thành công.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide">Mã vé của bạn</p>
                        <p className="text-3xl font-extrabold text-indigo-600 tracking-wider">
                            {bookingCode}
                        </p>
                    </div>

                    <div className="text-sm text-gray-600 text-center px-4">
                        Thông tin chi tiết vé đã được gửi đến email của bạn.
                        Bạn có thể xem lại trong mục Lịch sử vé.
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button
                        variant="outline"
                        className="w-full border-gray-300 hover:bg-gray-100"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Về trang chủ
                    </Button>
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => navigate('/profile/history')}
                    >
                        <History className="w-4 h-4 mr-2" /> Xem lịch sử vé
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}