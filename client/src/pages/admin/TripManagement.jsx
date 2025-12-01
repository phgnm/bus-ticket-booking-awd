import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarClock } from 'lucide-react';

export default function TripManagement() {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    
    const [formData, setFormData] = useState({
        route_id: '',
        bus_id: '',
        departure_time: '' // DateTime string
    });

    useEffect(() => {
        Promise.all([
            api.get('/admin/routes'),
            api.get('/admin/buses')
        ]).then(([routesRes, busesRes]) => {
            if(routesRes.data.success) setRoutes(routesRes.data.data);
            if(busesRes.data.success) setBuses(busesRes.data.data);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/trips', {
                route_id: parseInt(formData.route_id),
                bus_id: parseInt(formData.bus_id),
                departure_time: new Date(formData.departure_time).toISOString()
            });
            alert("Lên lịch chuyến đi thành công!");
        } catch (err) {
            // Hiển thị lỗi từ backend (ví dụ: xung đột lịch xe)
            alert(err.response?.data?.msg || "Lỗi lên lịch");
            if(err.response?.data?.conflict_trip) {
                console.log("Xung đột với chuyến:", err.response.data.conflict_trip);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="w-6 h-6 text-indigo-600"/>
                        Lên Lịch Chuyến Đi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>Chọn Tuyến đường</Label>
                            <select className="w-full border rounded-md p-2 mt-1" 
                                value={formData.route_id} onChange={e => setFormData({...formData, route_id: e.target.value})} required>
                                <option value="">-- Chọn tuyến --</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.from_name} - {r.to_name} ({parseInt(r.price_base).toLocaleString()}đ)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Chọn Xe (Bus)</Label>
                            <select className="w-full border rounded-md p-2 mt-1"
                                value={formData.bus_id} onChange={e => setFormData({...formData, bus_id: e.target.value})} required>
                                <option value="">-- Chọn xe --</option>
                                {buses.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.license_plate} ({b.brand} - {b.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Thời gian khởi hành</Label>
                            <Input 
                                type="datetime-local" 
                                value={formData.departure_time} 
                                onChange={e => setFormData({...formData, departure_time: e.target.value})}
                                required 
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Hệ thống sẽ tự động kiểm tra xung đột lịch trình của xe.</p>
                        </div>

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Xác nhận Lịch chạy
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}