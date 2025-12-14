import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import api from '@/lib/api';
import SeatSelector from '@/components/shared/SeatSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const STEPS = [
    { id: 1, title: 'Chọn ghế' },
    { id: 2, title: 'Thông tin hành khách' },
    { id: 3, title: 'Thanh toán & Xác nhận' }
];

export default function BookingPage() {
    const { state } = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const { bookingData, updateBookingData } = useBooking(); // Bỏ resetBooking ở đây vì sẽ reset sau khi thanh toán xong

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isInitialized = useRef(false);

    if (!state?.trip && !bookingData.trip) {
        return <Navigate to="/search" replace />;
    }

    const trip = state?.trip || bookingData.trip;

    useEffect(() => {
        if (isInitialized.current) return;

        const initData = {};
        let shouldJumpToStep2 = false;

        if (!bookingData.trip && trip) {
            initData.trip = trip;
        }

        if (state?.selectedSeats?.length > 0) {
            const seatsFromState = state.selectedSeats;
            const isDifferent = JSON.stringify(seatsFromState) !== JSON.stringify(bookingData.selectedSeats);

            if (isDifferent || bookingData.selectedSeats.length === 0) {
                initData.selectedSeats = seatsFromState;
                shouldJumpToStep2 = true;
            }
        }

        if (user && !bookingData.passengerInfo.email) {
            initData.passengerInfo = {
                name: user.full_name || '',
                email: user.email || '',
                phone: user.phone_number || ''
            };
        }

        if (Object.keys(initData).length > 0) {
            updateBookingData(initData);
        }

        if (shouldJumpToStep2) {
            setCurrentStep(2);
        }

        isInitialized.current = true;
    }, [state, user, trip, bookingData.trip, bookingData.selectedSeats, updateBookingData]);

    const handleSeatChange = (seats) => {
        updateBookingData({ selectedSeats: seats });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateBookingData({
            passengerInfo: { ...bookingData.passengerInfo, [name]: value }
        });
    };

    // --- MAIN PAYMENT LOGIC ---
    const handlePayment = async () => {
        if (bookingData.selectedSeats.length === 0) return;
        setIsSubmitting(true);

        try {
            const payload = {
                trip_id: trip.trip_id,
                seats: bookingData.selectedSeats,
                passenger_info: bookingData.passengerInfo
            };

            // Gọi API tạo Booking
            const res = await api.post('/bookings', payload);

            if (res.data.success) {
                toast({
                    title: "Đang chuyển hướng...",
                    description: res.data.msg || "Vui lòng hoàn tất thanh toán trên cổng PayOS."
                });

                // Lưu email vào sessionStorage để tiện tra cứu sau khi redirect về
                sessionStorage.setItem('last_booking_email', bookingData.passengerInfo.email);

                // Redirect sang PayOS Gateway
                if (res.data.paymentUrl) {
                    window.location.href = res.data.paymentUrl;
                } else {
                    // Fallback nếu không có link thanh toán (VD: booking miễn phí hoặc lỗi BE)
                    console.error("Thiếu paymentUrl trong response");
                }
            }
        } catch (error) {
            console.error("Payment Error:", error);

            // Xử lý lỗi 409 (Ghế đã bị đặt)
            if (error.response?.status === 409) {
                const { unavailable_seats, msg } = error.response.data;
                toast({
                    variant: "destructive",
                    title: "Ghế không khả dụng",
                    description: msg || `Ghế ${unavailable_seats?.join(', ')} đã bị đặt. Vui lòng chọn ghế khác.`
                });
                // Quay về bước 1 để chọn lại
                setCurrentStep(1);
            } else {
                toast({
                    variant: "destructive",
                    title: "Có lỗi xảy ra",
                    description: error.response?.data?.msg || "Không thể khởi tạo thanh toán. Vui lòng thử lại."
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPrice = bookingData.selectedSeats.length * parseFloat(trip.price_base);
    const seatLayout = trip.seat_capacity > 30 ? { rows: 10, cols: 4, aisle: 2 } : { rows: 7, cols: 3, aisle: 1 };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {/* Progress Bar */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
                {STEPS.map((s) => (
                    <div key={s.id} className={`flex flex-col items-center bg-background px-2 ${s.id <= currentStep ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${s.id <= currentStep ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-white'}`}>
                            {s.id < currentStep ? <CheckCircle size={16} /> : s.id}
                        </div>
                        <span className="text-xs font-medium">{s.title}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader><CardTitle>Chọn ghế ngồi</CardTitle></CardHeader>
                            <CardContent>
                                <SeatSelector
                                    tripId={trip.trip_id}
                                    seatLayout={seatLayout}
                                    initialSelectedSeats={bookingData.selectedSeats}
                                    onSelectionChange={handleSeatChange}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                        <Card>
                            <CardHeader><CardTitle>Thông tin hành khách</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label>Họ và tên</Label>
                                        <Input name="name" value={bookingData.passengerInfo.name} onChange={handleInputChange} placeholder="Nhập họ tên" />
                                    </div>
                                    <div>
                                        <Label>Số điện thoại</Label>
                                        <Input name="phone" value={bookingData.passengerInfo.phone} onChange={handleInputChange} placeholder="Nhập số điện thoại" />
                                    </div>
                                    <div>
                                        <Label>Email (Nhận vé điện tử)</Label>
                                        <Input name="email" type="email" value={bookingData.passengerInfo.email} onChange={handleInputChange} placeholder="Nhập email" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 3 && (
                        <Card>
                            <CardHeader><CardTitle>Xác nhận & Thanh toán</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border border-slate-100">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Chuyến xe:</span>
                                        <span className="font-medium">{trip.from_location_name} ➝ {trip.to_location_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Thời gian:</span>
                                        <span className="font-medium">{new Date(trip.departure_time).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Ghế đã chọn:</span>
                                        <span className="font-bold text-indigo-600">{bookingData.selectedSeats.join(', ')}</span>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-3 block">Phương thức thanh toán</Label>
                                    <div className="border border-indigo-200 bg-indigo-50 p-4 rounded-lg flex items-center space-x-3 cursor-pointer">
                                        <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                                        <CreditCard className="w-5 h-5 text-indigo-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-indigo-900">Thanh toán qua PayOS</p>
                                            <p className="text-xs text-indigo-700">QR Code, Thẻ nội địa, Thẻ quốc tế</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="md:col-span-1">
                    <Card className="sticky top-4 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-lg">Chi tiết giá</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between mb-4 text-sm text-gray-600">
                                <span>{bookingData.selectedSeats.length} x Ghế</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price_base)}</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between items-center mb-6">
                                <span className="font-bold">Tổng cộng</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {currentStep > 1 && (
                                    <Button variant="outline" onClick={() => setCurrentStep(c => c - 1)} disabled={isSubmitting}>
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
                                    </Button>
                                )}

                                {currentStep < 3 ? (
                                    <Button
                                        onClick={() => setCurrentStep(c => c + 1)}
                                        disabled={(currentStep === 1 && bookingData.selectedSeats.length === 0) || (currentStep === 2 && (!bookingData.passengerInfo.name || !bookingData.passengerInfo.phone || !bookingData.passengerInfo.email))}
                                        className="bg-indigo-600 hover:bg-indigo-700 w-full"
                                    >
                                        Tiếp tục <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handlePayment}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 w-full py-6 text-lg"
                                    >
                                        {isSubmitting ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}