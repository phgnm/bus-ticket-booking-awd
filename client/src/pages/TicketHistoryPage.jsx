import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2, Calendar, MapPin, Ticket, Clock, BusFront,
    AlertTriangle, XCircle, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"; // Giả sử bạn có component Dialog của shadcn/ui (nếu chưa có thì dùng modal html thường)
import TicketView from '@/components/TicketView'; // Tận dụng component TicketView đã làm

export default function TicketHistoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null); // Để hiện modal chi tiết

    // Hàm gọi API lấy danh sách
    const fetchHistory = async () => {
        try {
            const res = await api.get('/bookings/my-history');
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
            toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải lịch sử đặt vé" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchHistory();
    }, [user]);

    // Hàm xử lý hủy vé
    const handleCancelTicket = async (ticketId) => {
        if (!confirm("Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.")) return;

        try {
            const res = await api.post(`/bookings/${ticketId}/cancel`);
            if (res.data.success) {
                toast({ title: "Thành công", description: "Đã hủy vé thành công." });
                fetchHistory(); // Refresh lại danh sách
            }
        } catch (error) {
            const msg = error.response?.data?.msg || "Lỗi khi hủy vé";
            toast({ variant: "destructive", title: "Thất bại", description: msg });
        }
    };

    // Helper: Màu sắc trạng thái
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Helper: Dịch trạng thái sang tiếng Việt
    const getStatusText = (status) => {
        const map = {
            'CONFIRMED': 'Đã xác nhận',
            'PAID': 'Đã thanh toán',
            'PENDING': 'Chờ thanh toán',
            'CANCELLED': 'Đã hủy'
        };
        return map[status] || status;
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

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
                    {bookings.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Cột 1: Thông tin chuyến đi */}
                                    <div className="p-5 flex-1 space-y-3">
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

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500"></div>
                                                <div className="h-8 w-0.5 bg-slate-200 border-l border-dashed border-slate-300"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-1">
                                                <div className="font-medium text-slate-700">{item.from_location}</div>
                                                <div className="font-medium text-slate-700">{item.to_location}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột 2: Thông tin vé & Giá */}
                                    <div className="p-5 bg-slate-50/50 border-t md:border-t-0 md:border-l flex flex-col justify-between min-w-[200px]">
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

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 justify-end">
                                            {/* Nút Xem chi tiết (Mở Modal) */}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedBooking(item)}>
                                                        <Eye className="w-4 h-4 mr-1" /> Chi tiết
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Chi tiết vé xe</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        {/* Re-use TicketView component, cần format lại data cho khớp props nếu cấu trúc DB trả về khác */}
                                                        <TicketView booking={{
                                                            ...item,
                                                            seats: [item.seat_number], // TicketView nhận mảng
                                                            passenger_name: user.full_name,
                                                            passenger_phone: user.phone_number
                                                        }} />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            {/* Nút Hủy vé (Chỉ hiện nếu chưa hủy) */}
                                            {item.booking_status !== 'CANCELLED' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleCancelTicket(item.id)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Hủy vé
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}