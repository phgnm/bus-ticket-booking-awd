import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { changeBookingSeat } from '@/lib/api';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SEAT_COLORS = {
    AVAILABLE: "bg-card border-border hover:border-primary text-foreground cursor-pointer",
    BOOKED: "bg-red-100 border-red-200 text-red-400 cursor-not-allowed",
    CURRENT: "bg-yellow-100 border-yellow-400 text-yellow-800 border-2",
    SELECTED: "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 cursor-pointer",
};

export default function ChangeSeatDialog({ open, onOpenChange, booking, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [loadingSeats, setLoadingSeats] = useState(true);
    const [tripData, setTripData] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [bookedSeats, setBookedSeats] = useState([]);
    const { toast } = useToast();

    // Load thông tin ghế của chuyến xe khi mở dialog
    const fetchTripAndSeats = useCallback(async () => {
        if (!open || !booking) return;

        setLoadingSeats(true);
        try {
            // Gọi song song 2 API
            const [tripRes, seatStatusRes] = await Promise.all([
                api.get(`/trips/${booking.trip_id}`),
                api.get(`/trips/${booking.trip_id}/seat-status`)
            ]);

            if (tripRes.data.success) {
                setTripData(tripRes.data.data);
            }

            if (seatStatusRes.data.success) {
                // Lấy danh sách ghế đã được đặt (sold_seats)
                setBookedSeats(seatStatusRes.data.sold_seats || []);
            }

            // Mặc định chọn ghế hiện tại để hiển thị
            setSelectedSeat(booking.seat_number);
        } catch (error) {
            console.error("Failed to load trip seats", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin ghế. Vui lòng thử lại.",
                variant: "destructive"
            });
        } finally {
            setLoadingSeats(false);
        }
    }, [open, booking, toast]);

    useEffect(() => {
        fetchTripAndSeats();
    }, [fetchTripAndSeats]);

    // Reset state khi đóng dialog
    useEffect(() => {
        if (!open) {
            setSelectedSeat(null);
            setTripData(null);
            setBookedSeats([]);
        }
    }, [open]);

    const handleSeatClick = (seatNumber) => {
        // Không cho chọn ghế đã được đặt (trừ ghế hiện tại của user)
        if (bookedSeats.includes(seatNumber) && seatNumber !== booking.seat_number) {
            return;
        }
        setSelectedSeat(seatNumber);
    };

    const getSeatStatus = (seatNumber) => {
        if (seatNumber === booking.seat_number) return 'CURRENT';
        if (seatNumber === selectedSeat) return 'SELECTED';
        if (bookedSeats.includes(seatNumber)) return 'BOOKED';
        return 'AVAILABLE';
    };

    const renderSeatGrid = () => {
        if (!tripData) return null;

        // Parse layout từ trip data
        let seatLayout = { rows: 10, cols: 4, aisle: 2 }; // Default

        if (tripData.bus?.seat_layout) {
            seatLayout = typeof tripData.bus.seat_layout === 'string'
                ? JSON.parse(tripData.bus.seat_layout)
                : tripData.bus.seat_layout;
        } else if (tripData.seat_layout) {
            seatLayout = typeof tripData.seat_layout === 'string'
                ? JSON.parse(tripData.seat_layout)
                : tripData.seat_layout;
        }

        const { rows, cols, aisle } = seatLayout;
        let grid = [];

        for (let r = 1; r <= rows; r++) {
            let rowCells = [];
            for (let c = 1; c <= cols; c++) {
                const seatLabel = String.fromCharCode(64 + r) + c;
                const seatNumber = seatLabel;
                const status = getSeatStatus(seatNumber);

                rowCells.push(
                    <div
                        key={seatNumber}
                        onClick={() => handleSeatClick(seatNumber)}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex items-center justify-center m-1 transition-all shadow-sm relative",
                            SEAT_COLORS[status]
                        )}
                        title={`Ghế ${seatNumber} - ${status === 'CURRENT' ? 'Ghế hiện tại' : status === 'BOOKED' ? 'Đã đặt' : status === 'SELECTED' ? 'Ghế mới' : 'Trống'}`}
                    >
                        <span className="text-xs md:text-sm font-bold">{seatNumber}</span>
                    </div>
                );
                if (c === aisle) {
                    rowCells.push(<div key={`aisle-${r}`} className="w-4 md:w-8" />);
                }
            }
            grid.push(<div key={r} className="flex justify-center">{rowCells}</div>);
        }
        return grid;
    };

    const handleSubmit = async () => {
        if (!selectedSeat) {
            toast({
                title: "Chưa chọn ghế",
                description: "Vui lòng chọn ghế mới",
                variant: "destructive"
            });
            return;
        }

        if (selectedSeat === booking.seat_number) {
            toast({
                title: "Ghế không thay đổi",
                description: "Vui lòng chọn ghế khác ghế hiện tại",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            await changeBookingSeat(booking.id, selectedSeat);
            toast({
                title: "Thành công",
                description: `Đã đổi từ ghế ${booking.seat_number} sang ghế ${selectedSeat}!`,
                className: "bg-green-50 border-green-200"
            });
            onSuccess(); // Refresh lại danh sách vé bên ngoài
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Lỗi",
                description: error.response?.data?.msg || "Không thể đổi ghế",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Đổi ghế cho vé {booking.booking_code}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Ghế hiện tại: <span className="font-semibold text-yellow-700">{booking.seat_number}</span>
                        {selectedSeat && selectedSeat !== booking.seat_number && (
                            <> → Ghế mới: <span className="font-semibold text-indigo-600">{selectedSeat}</span></>
                        )}
                    </p>
                </DialogHeader>

                <div className="py-4">
                    {loadingSeats ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-2 text-muted-foreground">Đang tải sơ đồ ghế...</span>
                        </div>
                    ) : (
                        <div className="bg-card p-6 rounded-xl shadow-sm border">
                            <h3 className="text-lg font-bold mb-4 text-center">Sơ đồ ghế</h3>

                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-border bg-card"></div>
                                    Trống
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-100"></div>
                                    Ghế hiện tại
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600"></div>
                                    Ghế mới chọn
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-red-200 bg-red-100"></div>
                                    Đã đặt
                                </div>
                            </div>

                            {/* Seat Grid */}
                            <div className="mb-6 overflow-x-auto">
                                <div className="min-w-max mx-auto space-y-2">
                                    <div className="flex justify-center mb-4 text-slate-300">
                                        <div className="w-full h-1 bg-slate-100 rounded-full mx-10 relative">
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-background px-2">
                                                Tài xế
                                            </span>
                                        </div>
                                    </div>
                                    {renderSeatGrid()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || loadingSeats || !selectedSeat}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Đang xử lý...' : 'Xác nhận đổi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}