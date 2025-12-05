import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Giả sử bạn có hook này từ shadcn hoặc dùng alert
import { Loader2, Armchair } from 'lucide-react';

// Định nghĩa màu sắc cho từng trạng thái
const SEAT_COLORS = {
    AVAILABLE: "bg-white border-gray-300 hover:border-indigo-500 text-gray-700 cursor-pointer",
    BOOKED: "bg-red-100 border-red-200 text-red-400 cursor-not-allowed",
    LOCKED_BY_OTHERS: "bg-orange-100 border-orange-200 text-orange-400 cursor-not-allowed",
    SELECTED: "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 cursor-pointer",
};

export default function SeatSelector({ tripId, seatLayout, onSelectionChange }) {
    // State quản lý trạng thái ghế từ server
    const [soldSeats, setSoldSeats] = useState([]);
    const [lockedSeats, setLockedSeats] = useState([]); // [{ seat_number, locked_by_user_id }]
    const [myLockedSeats, setMyLockedSeats] = useState([]); // Danh sách ghế mình đang giữ

    const [loading, setLoading] = useState(true);
    const [processingSeat, setProcessingSeat] = useState(null); // Ghế đang được xử lý (để hiện loading spinner nhỏ)

    // Giả lập User ID (Trong thực tế lấy từ AuthContext)
    const currentUserId = "current_user_id_placeholder";

    // Polling Ref để clear interval khi unmount
    const pollingInterval = useRef(null);

    // 1. Hàm lấy trạng thái ghế mới nhất
    const fetchSeatStatus = useCallback(async () => {
        try {
            const res = await api.get(`/seat-status?trip_id=${tripId}`);
            if (res.data.success) {
                setSoldSeats(res.data.data.sold_seats);     // Mảng các số ghế: ['A1', 'A2']
                setLockedSeats(res.data.data.locked_seats); // Mảng object: [{ seat_number: 'A3', locked_by: 'xyz' }]
            }
        } catch (error) {
            console.error("Failed to fetch seat status:", error);
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    // 2. Setup Polling (Real-time)
    useEffect(() => {
        fetchSeatStatus(); // Gọi lần đầu

        pollingInterval.current = setInterval(() => {
            fetchSeatStatus();
        }, 5000); // 5 giây gọi 1 lần

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [fetchSeatStatus]);

    // 3. Xử lý logic Click ghế
    const handleSeatClick = async (seatNumber) => {
        // Kiểm tra trạng thái ghế hiện tại
        const status = getSeatStatus(seatNumber);

        // Không cho click nếu đã bán hoặc bị người khác khóa
        if (status === 'BOOKED' || status === 'LOCKED_BY_OTHERS') return;

        setProcessingSeat(seatNumber);

        try {
            if (status === 'SELECTED') {
                // Đang chọn -> Bỏ chọn (Unlock)
                const res = await api.post('/unlock-seat', { trip_id: tripId, seat_number: seatNumber });
                if (res.data.success) {
                    setMyLockedSeats(prev => prev.filter(s => s !== seatNumber));
                    onSelectionChange && onSelectionChange(myLockedSeats.filter(s => s !== seatNumber));
                }
            } else {
                // Đang trống -> Chọn (Lock)
                const res = await api.post('/lock-seat', { trip_id: tripId, seat_number: seatNumber });
                if (res.data.success) {
                    setMyLockedSeats(prev => [...prev, seatNumber]);
                    onSelectionChange && onSelectionChange([...myLockedSeats, seatNumber]);
                } else {
                    alert("Ghế này vừa bị người khác chọn!");
                    fetchSeatStatus(); // Refresh ngay lập tức
                }
            }
        } catch (error) {
            console.error("Lỗi thao tác ghế:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setProcessingSeat(null);
        }
    };

    // Helper: Xác định trạng thái hiển thị của một ghế
    const getSeatStatus = (seatNumber) => {
        if (soldSeats.includes(seatNumber)) return 'BOOKED';

        const lockedInfo = lockedSeats.find(s => s.seat_number === seatNumber);

        // Nếu mình đang giữ ghế này (kiểm tra local state hoặc check ID từ server nếu có)
        if (myLockedSeats.includes(seatNumber)) return 'SELECTED';

        // Nếu server báo ghế này bị lock và KHÔNG phải do mình (có thể check thêm ID nếu API trả về)
        if (lockedInfo && !myLockedSeats.includes(seatNumber)) return 'LOCKED_BY_OTHERS';

        return 'AVAILABLE';
    };

    // Helper: Render lưới ghế
    const renderSeatGrid = () => {
        const { rows, cols, aisle } = seatLayout; // Vd: { rows: 5, cols: 4, aisle: 2 }
        let grid = [];

        for (let r = 1; r <= rows; r++) {
            let rowCells = [];
            for (let c = 1; c <= cols; c++) {
                // Tạo số ghế: Vd A1, A2... hoặc 1, 2... tùy logic backend
                const seatLabel = String.fromCharCode(64 + r) + c; // A1, A2, B1...
                const seatNumber = seatLabel;
                const status = getSeatStatus(seatNumber);
                const isProcessing = processingSeat === seatNumber;

                // Render Ghế
                rowCells.push(
                    <div
                        key={seatNumber}
                        onClick={() => handleSeatClick(seatNumber)}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex items-center justify-center m-1 transition-all shadow-sm relative",
                            SEAT_COLORS[status]
                        )}
                        title={`Ghế ${seatNumber} - ${status}`}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-current" />
                        ) : (
                            <span className="text-xs md:text-sm font-bold">{seatNumber}</span>
                        )}

                        {/* Icon ghế nhỏ để trang trí */}
                        {status === 'SELECTED' && <Armchair className="absolute -top-1 -right-1 w-3 h-3 text-white bg-indigo-500 rounded-full p-0.5" />}
                    </div>
                );

                // Thêm lối đi (Aisle)
                if (c === aisle) {
                    rowCells.push(<div key={`aisle-${r}`} className="w-4 md:w-8" />); // Khoảng trống
                }
            }
            grid.push(<div key={r} className="flex justify-center">{rowCells}</div>);
        }
        return grid;
    };

    if (loading && soldSeats.length === 0) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold mb-4 text-center">Sơ đồ ghế</h3>

            {/* Chú thích */}
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-slate-600">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-gray-300 bg-white"></div> Trống</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600"></div> Đang chọn</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-red-200 bg-red-100"></div> Đã bán</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-orange-200 bg-orange-100"></div> Người khác giữ</div>
            </div>

            {/* Lưới ghế */}
            <div className="mb-6 overflow-x-auto">
                <div className="min-w-max mx-auto space-y-2">
                    {/* Vô lăng / Đầu xe */}
                    <div className="flex justify-center mb-4 text-slate-300">
                        <div className="w-full h-1 bg-slate-100 rounded-full mx-10 relative">
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-white px-2">Tài xế</span>
                        </div>
                    </div>

                    {renderSeatGrid()}
                </div>
            </div>

            {/* Tổng kết */}
            <div className="border-t pt-4 flex justify-between items-center">
                <div>
                    <span className="text-slate-500 text-sm">Ghế đã chọn:</span>
                    <div className="font-bold text-indigo-700">
                        {myLockedSeats.length > 0 ? myLockedSeats.join(', ') : 'Chưa chọn ghế'}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-slate-500 text-sm">Tổng cộng:</span>
                    <div className="font-bold text-xl text-indigo-700">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(myLockedSeats.length * 200000)}
                        {/* Giá vé mock, nên truyền props price vào */}
                    </div>
                </div>
            </div>
        </div>
    );
}