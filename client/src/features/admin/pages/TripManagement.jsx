import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarClock, Trash2, Bus, CalendarIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export default function TripManagement() {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [trips, setTrips] = useState([]);

    // Tách state ngày và giờ riêng để dễ quản lý UX
    const [date, setDate] = useState();
    const [time, setTime] = useState("");

    const [formData, setFormData] = useState({
        route_id: '',
        bus_id: '',
    });

    const fetchTrips = async () => {
        try {
            const res = await api.get('/admin/trips?limit=50');
            if (res.data.success) {
                setTrips(res.data.trips || []);
            }
        } catch (err) {
            console.error("Không thể tải danh sách chuyến đi:", err);
        }
    };

    useEffect(() => {
        Promise.all([
            api.get('/admin/routes'),
            api.get('/admin/buses')
        ]).then(([routesRes, busesRes]) => {
            if (routesRes.data.success) setRoutes(routesRes.data.data || []);
            if (busesRes.data.success) setBuses(busesRes.data.data || []);
        });
        fetchTrips();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!date || !time) {
            alert("Vui lòng chọn đầy đủ ngày và giờ khởi hành");
            return;
        }

        // Gộp Date và Time lại thành ISO String
        const submitDate = new Date(date);
        const [hours, minutes] = time.split(':');
        submitDate.setHours(parseInt(hours), parseInt(minutes));

        // Validation cơ bản: Không cho chọn quá khứ
        if (submitDate < new Date()) {
            alert("Thời gian khởi hành phải lớn hơn thời gian hiện tại!");
            return;
        }

        try {
            await api.post('/admin/trips', {
                route_id: parseInt(formData.route_id),
                bus_id: parseInt(formData.bus_id),
                departure_time: submitDate.toISOString()
            });
            alert("Lên lịch chuyến đi thành công!");

            // Reset form
            setDate(undefined);
            setTime("");
            fetchTrips();
        } catch (err) {
            alert(err.response?.data?.msg || "Lỗi lên lịch");
            if (err.response?.data?.conflict_trip) {
                console.log("Xung đột với chuyến:", err.response.data.conflict_trip);
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa chuyến đi này?")) return;
        try {
            await api.delete(`/admin/trips/${id}`);
            alert("Đã xóa chuyến đi thành công");
            fetchTrips();
        } catch (err) {
            alert(err.response?.data?.msg || "Lỗi khi xóa chuyến đi");
        }
    };

    const formatDateTime = (isoString) => {
        return new Date(isoString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CỘT TRÁI: FORM */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-indigo-600" />
                        Lên Lịch Mới
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Chọn Tuyến đường</Label>
                            <select className="w-full border rounded-md p-2 mt-1 text-sm bg-background"
                                value={formData.route_id} onChange={e => setFormData({ ...formData, route_id: e.target.value })} required>
                                <option value="">-- Chọn tuyến --</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.from_name} ➝ {r.to_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Chọn Xe</Label>
                            <select className="w-full border rounded-md p-2 mt-1 text-sm bg-background"
                                value={formData.bus_id} onChange={e => setFormData({ ...formData, bus_id: e.target.value })} required>
                                <option value="">-- Chọn xe --</option>
                                {buses.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.license_plate} ({b.brand})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CẢI TIẾN UX: DATE PICKER + TIME INPUT */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Ngày khởi hành</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal px-3",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            locale={vi} // Nếu muốn lịch tiếng Việt (cần import locale)
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Giờ chạy</Label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        className="pl-9"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Xác nhận Lịch chạy
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* CỘT PHẢI: LIST */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Danh sách chuyến đi sắp tới</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {trips.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Chưa có chuyến đi nào.</p>
                        ) : (
                            trips.map(trip => (
                                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:bg-accent/50 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                                            <span>{trip.from_name}</span>
                                            <span className="text-muted-foreground text-sm">➝</span>
                                            <span>{trip.to_name}</span>
                                        </div>
                                        <div className="text-sm text-primary font-medium flex items-center gap-2">
                                            <CalendarClock className="w-4 h-4" />
                                            {formatDateTime(trip.departure_time)}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Bus className="w-3 h-3" /> {trip.license_plate}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {parseInt(trip.price_base).toLocaleString()}đ
                                            </Badge>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${trip.status === 'SCHEDULED' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' :
                                                'bg-muted text-muted-foreground border-border'
                                                }`}>
                                                {trip.status}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(trip.id)}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}