import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2, Calendar, MapPin, Ticket, AlertTriangle, XCircle, Eye, ArrowRightLeft, Star // [MỚI] Thêm icon Star
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import TicketView from '@/components/shared/TicketView';
import ChangeSeatDialog from '../components/ChangeSeatDialog';
import ReviewDialog from '../components/ReviewDialog'; // [MỚI] Import Component Đánh giá

export default function TicketHistoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // --- State cho chức năng Hủy vé ---
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [ticketToCancel, setTicketToCancel] = useState(null);
    const [isCanceling, setIsCanceling] = useState(false);

    // --- State cho chức năng Đổi ghế ---
    const [isChangeSeatOpen, setIsChangeSeatOpen] = useState(false);
    const [selectedBookingToChange, setSelectedBookingToChange] = useState(null);

    // --- [MỚI] State cho chức năng Đánh giá ---
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [bookingToReview, setBookingToReview] = useState(null);

    // Hàm gọi API lấy danh sách
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings/my-bookings');
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error.response?.data?.msg || "Không thể tải lịch sử đặt vé"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchHistory();
    }, [user]);

    // 1. Mở Dialog xác nhận Hủy
    const openCancelDialog = (booking) => {
        setTicketToCancel(booking);
        setIsCancelDialogOpen(true);
    };

    // 2. Thực hiện gọi API hủy vé
    const handleConfirmCancel = async () => {
        if (!ticketToCancel) return;

        try {
            setIsCanceling(true);
            const res = await api.post(`/bookings/cancel/${ticketToCancel.id}`);

            if (res.data.success) {
                toast({
                    title: "Thành công",
                    description: res.data.msg || "Đã hủy vé thành công.",
                    className: "bg-green-50 border-green-200 text-green-800"
                });
                fetchHistory(); // Làm mới danh sách
                setIsCancelDialogOpen(false); // Đóng dialog
            }
        } catch (error) {
            console.error("Lỗi hủy vé:", error);
            const errorMsg = error.response?.data?.msg || "Lỗi khi hủy vé. Vui lòng thử lại.";

            toast({
                variant: "destructive",
                title: "Thất bại",
                description: errorMsg
            });
        } finally {
            setIsCanceling(false);
        }
    };

    // --- Handlers cho Đổi ghế ---
    const handleOpenChangeSeat = (booking) => {
        setSelectedBookingToChange(booking);
        setIsChangeSeatOpen(true);
    };

    const handleChangeSeatSuccess = () => {
        fetchHistory();
    };

    // --- [MỚI] Handlers cho Đánh giá ---
    const handleOpenReview = (booking) => {
        setBookingToReview(booking);
        setIsReviewOpen(true);
    };

    const handleReviewSuccess = () => {
        fetchHistory();
    };

    // Helper: Màu trạng thái
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'REFUNDED': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Helper: Tên trạng thái
    const getStatusText = (status) => {
        const map = {
            'CONFIRMED': 'Đã xác nhận',
            'PAID': 'Đã thanh toán',
            'PENDING_PAYMENT': 'Chờ thanh toán',
            'PENDING': 'Chờ xử lý',
            'CANCELLED': 'Đã hủy',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return map[status] || status;
    };

    // Helper: Kiểm tra quá hạn hủy (24h)
    const isPastCancellationTime = (departureTime) => {
        const now = new Date();
        const departure = new Date(departureTime);
        return differenceInHours(departure, now) < 24;
    };

    // [MỚI] Helper: Kiểm tra chuyến đi đã hoàn thành chưa (để hiện nút Review)
    const isTripCompleted = (departureTime) => {
        const now = new Date();
        const departure = new Date(departureTime);
        return now > departure;
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    <Ticket className="w-6 h-6 text-indigo-600" /> Lịch sử đặt vé của tôi
                </h1>
                <div className="text-sm text-slate-500">
                    Tổng cộng: <span className="font-bold text-indigo-600">{bookings.length}</span> vé
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
                        <Ticket className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Bạn chưa có chuyến đi nào</h3>
                    <p className="text-slate-500 mt-1">Hãy đặt vé ngay để bắt đầu hành trình mới!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((item) => {
                        const canCancel = item.booking_status !== 'CANCELLED' &&
                            item.booking_status !== 'REFUNDED';
                        const isTooLateToCancel = isPastCancellationTime(item.departure_time);
                        const tripDone = isTripCompleted(item.departure_time);

                        // Điều kiện hiển thị nút đánh giá: Đã thanh toán + Đã đi xong
                        const canReview = (item.booking_status === 'PAID' || item.booking_status === 'COMPLETED') && tripDone;

                        return (
                            <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Cột trái: Thông tin chuyến */}
                                        <div className="p-5 flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {format(new Date(item.departure_time), "dd 'tháng' MM, yyyy", { locale: vi })}
                                                    </div>
                                                    <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                        {format(new Date(item.departure_time), "HH:mm")}
                                                        <span className="text-sm font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            {item.bus_brand}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.booking_status)}`}>
                                                    {getStatusText(item.booking_status)}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center gap-0.5 mt-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500"></div>
                                                    <div className="h-10 w-0.5 bg-slate-200 border-l border-dashed border-slate-300"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                                </div>
                                                <div className="flex flex-col gap-3 flex-1">
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Điểm đón</div>
                                                        <div className="font-medium text-slate-700 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            {item.from_loc || item.from_location}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Điểm trả</div>
                                                        <div className="font-medium text-slate-700 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-indigo-500" />
                                                            {item.to_loc || item.to_location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cột phải: Thông tin vé & Hành động */}
                                        <div className="p-5 bg-slate-50/50 border-t md:border-t-0 md:border-l flex flex-col justify-between min-w-[240px]">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Mã vé:</span>
                                                    <span className="font-mono font-bold text-slate-700">{item.booking_code}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Ghế:</span>
                                                    <span className="font-bold text-indigo-600">{item.seat_number}</span>
                                                </div>
                                                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                                                    <span className="text-slate-500">Tổng tiền:</span>
                                                    <span className="font-bold text-indigo-700 text-lg">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_price)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4 justify-end flex-wrap">
                                                {/* [MỚI] Nút Đánh giá (Hiển thị đầu tiên nếu đủ điều kiện) */}
                                                {canReview && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                                                        onClick={() => handleOpenReview(item)}
                                                    >
                                                        <Star className="w-4 h-4 mr-1 fill-yellow-600" />
                                                        Đánh giá
                                                    </Button>
                                                )}

                                                {/* Nút Xem chi tiết */}
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedBooking(item)}>
                                                            <Eye className="w-4 h-4 mr-1" /> Chi tiết
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Chi tiết vé xe</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="py-4">
                                                            <TicketView booking={{
                                                                ...item,
                                                                from_location: item.from_loc || item.from_location,
                                                                to_location: item.to_loc || item.to_location,
                                                                seats: [item.seat_number],
                                                                passenger_name: user?.full_name,
                                                                passenger_phone: user?.phone_number,
                                                                passenger_email: user?.email
                                                            }} />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {/* Nút Đổi ghế (Chỉ hiện khi chưa đi và chưa hủy) */}
                                                {canCancel && !tripDone && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => handleOpenChangeSeat(item)}
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                                                        Đổi ghế
                                                    </Button>
                                                )}

                                                {/* Nút Hủy vé (Chỉ hiện khi chưa đi và chưa hủy) */}
                                                {canCancel && !tripDone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={isTooLateToCancel}
                                                        onClick={() => openCancelDialog(item)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        {isTooLateToCancel ? "Hết hạn hủy" : "Hủy vé"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialog xác nhận hủy vé */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Xác nhận hủy vé
                        </DialogTitle>
                        <DialogDescription>
                            Hành động này sẽ hủy vé xe của bạn và không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 text-slate-700">
                        <div className="bg-slate-50 p-3 rounded-md mb-3 text-sm border border-slate-100">
                            <p><strong>Mã vé:</strong> {ticketToCancel?.booking_code}</p>
                            <p><strong>Chuyến:</strong> {ticketToCancel?.from_loc} đi {ticketToCancel?.to_loc}</p>
                            <p><strong>Giờ khởi hành:</strong> {ticketToCancel && format(new Date(ticketToCancel.departure_time), "HH:mm dd/MM/yyyy")}</p>
                        </div>

                        <p className="text-sm font-semibold mb-1">Chính sách hoàn tiền:</p>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                            <li>Nếu vé đã thanh toán: Hoàn 90% giá trị vé.</li>
                            <li>Nếu vé chưa thanh toán: Hủy vé ngay lập tức.</li>
                            <li>Thời gian hoàn tiền: 5-7 ngày làm việc.</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsCancelDialogOpen(false)}
                            disabled={isCanceling}
                        >
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={isCanceling}
                        >
                            {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCanceling ? "Đang xử lý..." : "Xác nhận hủy"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Đổi ghế */}
            <ChangeSeatDialog
                open={isChangeSeatOpen}
                onOpenChange={setIsChangeSeatOpen}
                booking={selectedBookingToChange}
                onSuccess={handleChangeSeatSuccess}
            />

            {/* [MỚI] Dialog Đánh giá */}
            <ReviewDialog
                open={isReviewOpen}
                onOpenChange={setIsReviewOpen}
                booking={bookingToReview}
                onSuccess={handleReviewSuccess}
            />
        </div>
    );
}