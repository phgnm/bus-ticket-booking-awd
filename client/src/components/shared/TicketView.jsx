import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BusFront, Calendar, Clock, MapPin, User, Phone } from 'lucide-react';

export default function TicketView({ booking }) {
    if (!booking) return null;

    // Format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Format ngày giờ
    const departureDate = booking.departure_time ? new Date(booking.departure_time) : new Date();
    const formattedDate = format(departureDate, "dd 'tháng' MM, yyyy", { locale: vi });
    const formattedTime = format(departureDate, "HH:mm");

    return (
        <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden border flex flex-col md:flex-row">
            {/* Phần trái: Thông tin chính */}
            <div className="flex-1 p-6 relative">
                <div className="flex justify-between items-start border-b border-dashed border-border pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-700 uppercase tracking-wide">Vé Xe Khách</h2>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <BusFront className="w-4 h-4" />
                            <span>{booking.bus_brand || 'Nhà xe ABC'} • {booking.license_plate}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.booking_status === 'CONFIRMED' || booking.booking_status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {booking.booking_status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Điểm đi</label>
                        <div className="flex items-center gap-2 mt-1 font-medium text-foreground">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            {booking.from_location}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Điểm đến</label>
                        <div className="flex items-center gap-2 mt-1 font-medium text-foreground">
                            <MapPin className="w-4 h-4 text-red-500" />
                            {booking.to_location}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Ngày khởi hành</label>
                        <div className="flex items-center gap-2 mt-1 font-medium text-foreground">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formattedDate}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Giờ chạy</label>
                        <div className="flex items-center gap-2 mt-1 font-medium text-foreground">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {formattedTime}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-muted-foreground block">Hành khách</span>
                        <div className="flex items-center gap-2 font-medium text-sm">
                            <User className="w-3 h-3" /> {booking.passenger_name}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground block">Số điện thoại</span>
                        <div className="flex items-center gap-2 font-medium text-sm">
                            <Phone className="w-3 h-3" /> {booking.passenger_phone}
                        </div>
                    </div>
                </div>

                {/* Hình tròn trang trí mô phỏng vé cắt */}
                <div className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full -translate-y-1/2 z-10 hidden md:block"></div>
            </div>

            {/* Phần phải: QR Code & Ghế (Tách biệt bằng border dashed) */}
            <div className="md:w-64 bg-muted/30 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-border relative">
                <div className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full -translate-y-1/2 z-10 hidden md:block border-r border-border"></div>

                <div className="mb-4 bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                    <QRCodeSVG
                        value={booking.booking_code || 'INVALID'}
                        size={120}
                        fgColor="#1e1b4b"
                    />
                </div>

                <div className="text-center w-full">
                    <div className="text-xs text-muted-foreground mb-1">Mã đặt chỗ</div>
                    <div className="text-xl font-mono font-bold text-indigo-800 tracking-wider mb-3">
                        {booking.booking_code}
                    </div>

                    <div className="border-t border-gray-200 pt-3 w-full flex justify-between items-center px-2">
                        <div className="text-left">
                            <div className="text-xs text-gray-400">Số ghế</div>
                            <div className="font-bold text-indigo-600">
                                {Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Tổng tiền</div>
                            <div className="font-bold text-indigo-600">
                                {formatCurrency(booking.total_price)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}