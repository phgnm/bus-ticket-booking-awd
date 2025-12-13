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
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const STEPS = [
    { id: 1, title: 'Chọn ghế' },
    { id: 2, title: 'Thông tin hành khách' },
    { id: 3, title: 'Thanh toán & Xác nhận' }
];

export default function BookingPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const { bookingData, updateBookingData, resetBooking } = useBooking();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dùng ref để đảm bảo logic init chỉ chạy 1 lần khi mount component
    const isInitialized = useRef(false);

    // Nếu không có dữ liệu chuyến đi trong cả Context lẫn State (do refresh hoặc vào link trực tiếp) -> Về trang Search
    if (!state?.trip && !bookingData.trip) {
        return <Navigate to="/search" replace />;
    }

    // Ưu tiên lấy trip từ state mới nhất, nếu không thì lấy từ context
    const trip = state?.trip || bookingData.trip;

    // --- LOGIC KHỞI TẠO DỮ LIỆU ---
    useEffect(() => {
        if (isInitialized.current) return; // Chỉ chạy 1 lần

        const initData = {};
        let shouldJumpToStep2 = false;

        // 1. Cập nhật Trip vào Context nếu chưa có
        if (!bookingData.trip && trip) {
            initData.trip = trip;
        }

        // 2. [QUAN TRỌNG] Nhận ghế từ trang Search (location.state.selectedSeats)
        // Nếu có ghế từ state VÀ (Context đang rỗng hoặc khác với state) -> Cập nhật
        if (state?.selectedSeats?.length > 0) {
            const seatsFromState = state.selectedSeats;
            // So sánh đơn giản để xem có cần update không
            const isDifferent = JSON.stringify(seatsFromState) !== JSON.stringify(bookingData.selectedSeats);

            if (isDifferent || bookingData.selectedSeats.length === 0) {
                initData.selectedSeats = seatsFromState;
                shouldJumpToStep2 = true; // Đánh dấu để nhảy bước
            }
        }

        // 3. Auto-fill thông tin user nếu đã login
        if (user && !bookingData.passengerInfo.email) {
            initData.passengerInfo = {
                name: user.full_name || '',
                email: user.email || '',
                phone: user.phone_number || ''
            };
        }

        // Thực hiện update context 1 lần duy nhất để tránh re-render nhiều lần
        if (Object.keys(initData).length > 0) {
            updateBookingData(initData);
        }

        // Nhảy bước nếu đã có ghế được chọn từ trước
        if (shouldJumpToStep2) {
            setCurrentStep(2);
        }

        isInitialized.current = true;
    }, [state, user, trip, bookingData.trip, bookingData.selectedSeats, bookingData.passengerInfo.email, updateBookingData]);

    // --- STEP 1: LOGIC CHỌN GHẾ ---
    const handleSeatChange = (seats) => {
        updateBookingData({ selectedSeats: seats });
    };

    // --- STEP 2: LOGIC FORM ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateBookingData({
            passengerInfo: { ...bookingData.passengerInfo, [name]: value }
        });
    };

    // --- STEP 3: SUBMIT BOOKING ---
    const handleBooking = async () => {
        if (bookingData.selectedSeats.length === 0) return;
        setIsSubmitting(true);

        try {
            const payload = {
                trip_id: trip.trip_id,
                seats: bookingData.selectedSeats,
                passenger_info: bookingData.passengerInfo
            };

            const res = await api.post('/bookings', payload);

            if (res.data.success) {
                toast({ title: "Thành công", description: "Đặt vé thành công!" });
                resetBooking(); // Reset context
                navigate(`/booking-success?code=${res.data.data.booking_code}`);
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.msg || "Lỗi đặt vé";

            toast({
                variant: "destructive",
                title: "Đặt vé thất bại",
                description: msg
            });

            // Nếu lỗi Conflict (409 - Ghế đã bị đặt), quay lại Step 1 để chọn lại
            if (error.response?.status === 409) {
                setCurrentStep(1);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER HELPERS ---
    const totalPrice = bookingData.selectedSeats.length * parseFloat(trip.price_base);

    // Mock layout ghế (Logic tạm thời)
    const seatLayout = trip.seat_capacity > 30
        ? { rows: 10, cols: 4, aisle: 2 }
        : { rows: 7, cols: 3, aisle: 1 };

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
                {/* LEFT COLUMN: MAIN CONTENT */}
                <div className="md:col-span-2 space-y-6">
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader><CardTitle>Chọn ghế ngồi</CardTitle></CardHeader>
                            <CardContent>
                                <SeatSelector
                                    tripId={trip.trip_id}
                                    seatLayout={seatLayout}
                                    initialSelectedSeats={bookingData.selectedSeats} // [IMPORTANT] Truyền ghế đã chọn vào đây
                                    onSelectionChange={handleSeatChange}
                                />
                                <div className="mt-4 text-center text-sm text-gray-500">
                                    Ghế bạn chọn sẽ được giữ trong 10 phút.
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                        <Card>
                            <CardHeader><CardTitle>Thông tin liên hệ</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Họ và tên</Label>
                                    <Input
                                        name="name"
                                        value={bookingData.passengerInfo.name}
                                        onChange={handleInputChange}
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <Label>Số điện thoại</Label>
                                    <Input
                                        name="phone"
                                        value={bookingData.passengerInfo.phone}
                                        onChange={handleInputChange}
                                        placeholder="09xxx..."
                                    />
                                </div>
                                <div>
                                    <Label>Email (để nhận vé)</Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={bookingData.passengerInfo.email}
                                        onChange={handleInputChange}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 3 && (
                        <Card>
                            <CardHeader><CardTitle>Xác nhận & Thanh toán</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                                    <p><strong>Chuyến xe:</strong> {trip.from_location_name} - {trip.to_location_name}</p>
                                    <p><strong>Giờ khởi hành:</strong> {new Date(trip.departure_time).toLocaleString('vi-VN')}</p>
                                    <p><strong>Nhà xe:</strong> {trip.brand} ({trip.license_plate})</p>
                                    <p><strong>Ghế đã chọn:</strong> {bookingData.selectedSeats.join(', ')}</p>
                                </div>

                                <div>
                                    <Label className="mb-2 block">Phương thức thanh toán</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50">
                                            <input type="radio" id="pay_station" name="payment" checked readOnly />
                                            <Label htmlFor="pay_station" className="cursor-pointer">Thanh toán tại nhà xe</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50 opacity-50">
                                            <input type="radio" id="banking" name="payment" disabled />
                                            <Label htmlFor="banking">Chuyển khoản (Đang bảo trì)</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN: SUMMARY & NAVIGATION */}
                <div className="md:col-span-1">
                    <Card className="sticky top-4">
                        <CardHeader><CardTitle>Tổng tiền</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-600 mb-6">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
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
                                        disabled={
                                            (currentStep === 1 && bookingData.selectedSeats.length === 0) ||
                                            (currentStep === 2 && (!bookingData.passengerInfo.name || !bookingData.passengerInfo.phone || !bookingData.passengerInfo.email))
                                        }
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Tiếp tục <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleBooking}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 w-full"
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt vé'}
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