import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { MapPin, Filter, ArrowRight, Bus, Wifi, Tv, Armchair } from 'lucide-react';

// Custom Components
import SeatSelector from '@/components/shared/SeatSelector'; // Đảm bảo bạn đã tạo file này

export default function TripSearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [filters, setFilters] = useState({
        bus_type: '',
        sort_by: 'time',
        order: 'asc'
    });

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(searchParams);

            // Append local filters to query
            if (filters.bus_type) query.set('bus_type', filters.bus_type);
            if (filters.sort_by) query.set('sort_by', filters.sort_by);
            query.set('order', filters.order);

            const res = await api.get(`/trips?${query.toString()}`);
            if (res.data.success) {
                setTrips(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách chuyến đi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [searchParams, filters]);

    // Format Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };
    const getDuration = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60}p`;

    return (
        <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row gap-6">

                {/* --- SIDEBAR: BỘ LỌC --- */}
                <aside className="w-full md:w-1/4 space-y-6">
                    <Card>
                        <CardContent className="p-5 space-y-6">
                            <div className="flex items-center gap-2 font-bold text-lg border-b pb-2">
                                <Filter className="w-5 h-5" /> Bộ lọc
                            </div>

                            {/* Sort */}
                            <div>
                                <Label className="mb-2 block">Sắp xếp theo</Label>
                                <select
                                    className="w-full border rounded p-2 text-sm bg-white"
                                    value={filters.sort_by}
                                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                                >
                                    <option value="time">Giờ khởi hành</option>
                                    <option value="price">Giá tiền</option>
                                    <option value="duration">Thời gian di chuyển</option>
                                </select>
                                <div className="flex gap-2 mt-2">
                                    <Button variant={filters.order === 'asc' ? 'default' : 'outline'} size="sm" onClick={() => setFilters({ ...filters, order: 'asc' })} className="flex-1">Tăng dần</Button>
                                    <Button variant={filters.order === 'desc' ? 'default' : 'outline'} size="sm" onClick={() => setFilters({ ...filters, order: 'desc' })} className="flex-1">Giảm dần</Button>
                                </div>
                            </div>

                            {/* Bus Type Filter */}
                            <div>
                                <Label className="mb-2 block">Loại xe</Label>
                                <div className="space-y-2">
                                    {['Sleeper', 'Limousine', 'Seater'].map(type => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={type}
                                                name="bus_type"
                                                checked={filters.bus_type === type}
                                                onChange={() => setFilters({ ...filters, bus_type: type })}
                                                className="accent-indigo-600 h-4 w-4"
                                            />
                                            <label htmlFor={type} className="text-sm font-medium cursor-pointer">
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio" id="all" name="bus_type"
                                            checked={filters.bus_type === ''} onChange={() => setFilters({ ...filters, bus_type: '' })}
                                            className="accent-indigo-600 h-4 w-4"
                                        />
                                        <label htmlFor="all" className="text-sm cursor-pointer">Tất cả</label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                {/* --- MAIN: DANH SÁCH CHUYẾN ĐI --- */}
                <main className="flex-1">
                    <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm: {trips.length} chuyến</h2>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                            <Bus className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">Không tìm thấy chuyến xe nào phù hợp.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {trips.map(trip => (
                                <TripCard
                                    key={trip.trip_id}
                                    trip={trip}
                                    formatCurrency={formatCurrency}
                                    formatTime={formatTime}
                                    getDuration={getDuration}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: TripCard ---
function TripCard({ trip, formatCurrency, formatTime, getDuration }) {
    const [expandedInfo, setExpandedInfo] = useState(false); // Trạng thái xem chi tiết tiện ích
    const [showSeatSelection, setShowSeatSelection] = useState(false); // Trạng thái mở chọn ghế
    const [selectedSeats, setSelectedSeats] = useState([]); // Ghế đang chọn

    const navigate = useNavigate();

    // Parse layout từ JSON string (nếu có) hoặc dùng layout mặc định
    const seatLayout = trip.seat_layout
        ? (typeof trip.seat_layout === 'string' ? JSON.parse(trip.seat_layout) : trip.seat_layout)
        : { rows: 6, cols: 4, aisle: 2 }; // Default layout fallback

    const handleBooking = () => {
        if (selectedSeats.length === 0) return;

        // Chuyển hướng sang trang thanh toán kèm thông tin vé
        navigate('/booking', {
            state: {
                trip,
                selectedSeats,
                totalPrice: selectedSeats.length * trip.price_base
            }
        });
    };

    return (
        <Card className={cn("transition-all border-l-4", showSeatSelection ? "border-l-green-500 shadow-lg ring-1 ring-green-500" : "border-l-indigo-500 hover:shadow-md")}>
            <CardContent className="p-6">
                {/* 1. Thông tin cơ bản chuyến đi */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left Info */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-indigo-700">{formatTime(trip.departure_time)}</h3>
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                <span className="border-b border-dotted border-slate-400 w-8"></span>
                                {getDuration(trip.estimated_duration)}
                                <span className="border-b border-dotted border-slate-400 w-8"></span>
                            </div>
                            {/* Thời gian đến dự kiến (tính toán đơn giản) */}
                            <span className="text-slate-600 font-medium">
                                {formatTime(new Date(new Date(trip.departure_time).getTime() + trip.estimated_duration * 60000).toISOString())}
                            </span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100 max-w-md">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="font-medium text-sm">{trip.from_location_name}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span className="font-medium text-sm">{trip.to_location_name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{trip.brand}</span>
                            <span className="flex items-center gap-1"><Bus className="w-3 h-3" /> {trip.bus_type}</span>
                            <span>• {trip.available_seats} ghế trống</span>
                        </div>
                    </div>

                    {/* Right Price & Action */}
                    <div className="flex flex-col justify-between items-end min-w-[150px]">
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-indigo-600">{formatCurrency(trip.price_base)}</span>
                            <span className="text-xs text-slate-400">/ vé</span>
                        </div>

                        <div className="flex gap-2 w-full mt-4 md:mt-0">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setExpandedInfo(!expandedInfo);
                                    setShowSeatSelection(false); // Đóng chọn ghế nếu xem info
                                }}
                            >
                                {expandedInfo ? 'Ẩn' : 'Thông tin'}
                            </Button>

                            <Button
                                className={cn("flex-1", showSeatSelection ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700")}
                                onClick={() => {
                                    setShowSeatSelection(!showSeatSelection);
                                    setExpandedInfo(false); // Đóng info nếu chọn ghế
                                }}
                            >
                                {showSeatSelection ? 'Đóng' : 'Chọn chuyến'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Expanded Info (Amenities) */}
                {expandedInfo && (
                    <div className="mt-6 pt-4 border-t space-y-4 text-sm animate-in slide-in-from-top-2 fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2 text-slate-800">Tiện ích</h4>
                                <div className="flex gap-3 flex-wrap">
                                    {trip.amenities && (typeof trip.amenities === 'string' ? JSON.parse(trip.amenities) : trip.amenities).map((a, i) => (
                                        <span key={i} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {a === 'Wifi' && <Wifi className="w-3 h-3" />}
                                            {a === 'TV' && <Tv className="w-3 h-3" />}
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-slate-800">Chính sách</h4>
                                <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    <li>Không hoàn hủy trước 24h giờ khởi hành.</li>
                                    <li>Trẻ em dưới 5 tuổi miễn phí nếu ngồi cùng bố mẹ.</li>
                                    <li>Yêu cầu có mặt tại bến trước 30 phút.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Seat Selection Area */}
                {showSeatSelection && (
                    <div className="mt-6 border-t pt-6 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* Seat Map Component */}
                            <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <SeatSelector
                                    tripId={trip.trip_id}
                                    seatLayout={seatLayout}
                                    onSelectionChange={setSelectedSeats}
                                />
                            </div>

                            {/* Booking Summary Sidebar (Inside Card) */}
                            <div className="w-full lg:w-1/3 space-y-4">
                                <div className="bg-white p-4 rounded-xl border shadow-sm h-full flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <Armchair className="w-5 h-5 text-indigo-600" />
                                            Thông tin đặt vé
                                        </h4>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Số lượng:</span>
                                                <span className="font-medium">{selectedSeats.length} vé</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Ghế đã chọn:</span>
                                                <span className="font-medium text-indigo-600">
                                                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : '---'}
                                                </span>
                                            </div>
                                            <div className="border-t my-2"></div>
                                            <div className="flex justify-between items-center text-lg">
                                                <span className="font-bold text-slate-700">Tổng cộng:</span>
                                                <span className="font-bold text-red-600">
                                                    {formatCurrency(selectedSeats.length * trip.price_base)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-6"
                                        disabled={selectedSeats.length === 0}
                                        onClick={handleBooking}
                                    >
                                        Tiếp tục đặt vé <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}