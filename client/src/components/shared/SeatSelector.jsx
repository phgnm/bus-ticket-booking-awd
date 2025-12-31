// client/src/components/SeatSelector.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, Armchair } from 'lucide-react';

const SEAT_COLORS = {
    AVAILABLE: "bg-card border-border hover:border-primary text-foreground cursor-pointer",
    BOOKED: "bg-red-100 border-red-200 text-red-400 cursor-not-allowed",
    LOCKED_BY_OTHERS: "bg-orange-100 border-orange-200 text-orange-400 cursor-not-allowed",
    SELECTED: "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 cursor-pointer",
};

// [SỬA]: Thêm prop initialSelectedSeats, mặc định là mảng rỗng
export default function SeatSelector({ tripId, seatLayout, onSelectionChange, initialSelectedSeats = [] }) {
    const [soldSeats, setSoldSeats] = useState([]);
    const [lockedSeats, setLockedSeats] = useState([]);

    // [SỬA]: Chỉ khởi tạo giá trị ban đầu (Initial State), KHÔNG dùng useEffect để sync đè lại state
    // Việc này giúp logic click/API bên dưới hoạt động độc lập như code cũ.
    const [myLockedSeats, setMyLockedSeats] = useState(initialSelectedSeats);

    const [loading, setLoading] = useState(true);
    const [processingSeat, setProcessingSeat] = useState(null);
    const pollingInterval = useRef(null);

    const fetchSeatStatus = useCallback(async () => {
        try {
            const res = await api.get(`/trips/${tripId}/seat-status`);
            if (res.data.success) {
                setSoldSeats(res.data.sold_seats);
                setLockedSeats(res.data.locked_seats);
            }
        } catch (error) {
            console.error("Failed to fetch seat status:", error);
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        fetchSeatStatus();
        pollingInterval.current = setInterval(() => {
            fetchSeatStatus();
        }, 1000); // Giữ nguyên polling 1s như code gốc của bạn (hoặc 0.5s tùy ý)

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [fetchSeatStatus]);

    const handleSeatClick = async (seatNumber) => {
        const status = getSeatStatus(seatNumber);

        if (status === 'BOOKED' || status === 'LOCKED_BY_OTHERS') return;

        setProcessingSeat(seatNumber);

        try {
            if (status === 'SELECTED') {
                // Unlock logic (Giữ nguyên code cũ)
                const res = await api.post(`/trips/${tripId}/unlock-seat`, { seat_number: seatNumber });

                if (res.data.success) {
                    setMyLockedSeats(prev => {
                        const newSeats = prev.filter(s => s !== seatNumber);
                        // Gọi callback để báo cho BookingPage biết ngay khi state thay đổi
                        onSelectionChange && onSelectionChange(newSeats);
                        return newSeats;
                    });
                }
            } else {
                // Lock logic (Giữ nguyên code cũ)
                const res = await api.post(`/trips/${tripId}/lock-seat`, { seat_number: seatNumber });

                if (res.data.success) {
                    setMyLockedSeats(prev => {
                        const newSeats = [...prev, seatNumber];
                        onSelectionChange && onSelectionChange(newSeats);
                        return newSeats;
                    });
                } else {
                    alert("Ghế này vừa bị người khác chọn!");
                    fetchSeatStatus();
                }
            }
        } catch (error) {
            console.error("Lỗi thao tác ghế:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setProcessingSeat(null);
        }
    };

    const getSeatStatus = (seatNumber) => {
        if (soldSeats.includes(seatNumber)) return 'BOOKED';
        const isLocked = lockedSeats.includes(seatNumber);
        if (myLockedSeats.includes(seatNumber)) return 'SELECTED';
        if (isLocked && !myLockedSeats.includes(seatNumber)) return 'LOCKED_BY_OTHERS';
        return 'AVAILABLE';
    };

    const renderSeatGrid = () => {
        if (!seatLayout) return null;
        const { rows, cols, aisle } = seatLayout;
        let grid = [];

        for (let r = 1; r <= rows; r++) {
            let rowCells = [];
            for (let c = 1; c <= cols; c++) {
                const seatLabel = String.fromCharCode(64 + r) + c;
                const seatNumber = seatLabel;
                const status = getSeatStatus(seatNumber);
                const isProcessing = processingSeat === seatNumber;

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
                        {status === 'SELECTED' && <Armchair className="absolute -top-1 -right-1 w-3 h-3 text-white bg-indigo-500 rounded-full p-0.5" />}
                    </div>
                );
                if (c === aisle) rowCells.push(<div key={`aisle-${r}`} className="w-4 md:w-8" />);
            }
            grid.push(<div key={r} className="flex justify-center">{rowCells}</div>);
        }
        return grid;
    };

    if (loading && soldSeats.length === 0) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;
    }

    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border max-w-2xl mx-auto">
            <h3 className="text-lg font-bold mb-4 text-center">Sơ đồ ghế</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-border bg-card"></div> Trống</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600"></div> Đang chọn</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-red-200 bg-red-100"></div> Đã bán</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border border-orange-200 bg-orange-100"></div> Người khác giữ</div>
            </div>
            <div className="mb-6 overflow-x-auto">
                <div className="min-w-max mx-auto space-y-2">
                    <div className="flex justify-center mb-4 text-muted-foreground">
                        <div className="w-full h-1 bg-border rounded-full mx-10 relative">
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-background px-2">Tài xế</span>
                        </div>
                    </div>
                    {renderSeatGrid()}
                </div>
            </div>
            {/* Phần hiển thị tổng tiền ở dưới giữ nguyên nếu bạn cần, hoặc có thể bỏ qua nếu BookingPage đã hiển thị */}
        </div>
    );
}