import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Plus, Trash2 } from 'lucide-react';

export default function RouteManagement() {
    const [locations, setLocations] = useState([]);
    const [routes, setRoutes] = useState([]);
    
    const [formData, setFormData] = useState({
        route_from: '',
        route_to: '',
        distance: '',
        estimated_duration: '',
        price_base: ''
    });

    // Điểm đón trả demo (trong thực tế cần API lấy danh sách points)
    // Để đơn giản cho bài này, ta sẽ không implement phần chọn Points phức tạp
    // mà chỉ tạo Route cơ bản (From -> To).

    useEffect(() => {
        // Lấy danh sách địa điểm để nạp vào Select box
        api.get('/locations').then(res => setLocations(res.data.data || []));
        api.get('/admin/routes').then(res => setRoutes(res.data.data || []));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/routes', {
                ...formData,
                route_from: parseInt(formData.route_from),
                route_to: parseInt(formData.route_to),
                distance: parseInt(formData.distance),
                estimated_duration: parseInt(formData.estimated_duration),
                price_base: parseInt(formData.price_base),
                points: [] // Mảng rỗng cho MVP
            });
            alert("Tạo tuyến đường thành công");
            api.get('/admin/routes').then(res => setRoutes(res.data.data || []));
        } catch (err) {
            alert("Lỗi tạo tuyến đường");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Cấu hình Tuyến đường</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="py-2">Điểm đi</Label>
                                <select className="w-full border rounded p-2 text-sm" 
                                    value={formData.route_from} onChange={e => setFormData({...formData, route_from: e.target.value})} required>
                                    <option value="">Chọn...</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="py-2">Điểm đến</Label>
                                <select className="w-full border rounded p-2 text-sm"
                                    value={formData.route_to} onChange={e => setFormData({...formData, route_to: e.target.value})} required>
                                    <option value="">Chọn...</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="py-2">Khoảng cách (km)</Label>
                            <Input type="number" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} required />
                        </div>
                        <div>
                            <Label className="py-2">Thời gian chạy (phút)</Label>
                            <Input type="number" value={formData.estimated_duration} onChange={e => setFormData({...formData, estimated_duration: e.target.value})} required />
                        </div>
                        <div>
                            <Label className="py-2">Giá vé cơ bản (VND)</Label>
                            <Input type="number" value={formData.price_base} onChange={e => setFormData({...formData, price_base: e.target.value})} required />
                        </div>
                        <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-2"/> Tạo Tuyến</Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Danh sách tuyến đường</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {routes.map(route => (
                            <div key={route.id} className="flex items-center justify-between p-4 border rounded bg-white">
                                <div className="flex items-center gap-3">
                                    <Map className="text-indigo-500" />
                                    <div>
                                        <h4 className="font-bold">{route.from_name} ➝ {route.to_name}</h4>
                                        <p className="text-sm text-slate-500">{route.distance}km • {Math.floor(route.estimated_duration/60)}h{route.estimated_duration%60}p • {parseInt(route.price_base).toLocaleString()}đ</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}