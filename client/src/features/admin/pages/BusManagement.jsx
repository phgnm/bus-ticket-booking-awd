import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Armchair } from 'lucide-react';

export default function BusManagement() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        license_plate: '',
        brand: '',
        seat_capacity: 40,
        type: 'Sleeper',
        amenities: '', // Nhập chuỗi cách nhau bởi dấu phẩy
        images: '',    // Nhập URL ảnh mockup
        rows: 10,
        cols: 4,
        aisle: 2 // Vị trí lối đi (sau cột thứ mấy)
    });

    const fetchBuses = async () => {
        try {
            const res = await api.get('/admin/buses');
            if (res.data.success) setBuses(res.data.data);
        } catch (error) {
            console.error("Error fetching buses", error);
        }
    };

    useEffect(() => { fetchBuses(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Tạo sơ đồ ghế đơn giản dựa trên rows/cols
            const seat_layout = {
                rows: parseInt(formData.rows),
                cols: parseInt(formData.cols),
                aisle: parseInt(formData.aisle)
            };

            const payload = {
                license_plate: formData.license_plate,
                brand: formData.brand,
                seat_capacity: parseInt(formData.seat_capacity),
                type: formData.type,
                seat_layout: seat_layout,
                amenities: formData.amenities.split(',').map(s => s.trim()),
                images: formData.images ? [formData.images] : []
            };

            await api.post('/admin/buses', payload);
            alert("Tạo xe thành công!");
            setFormData({ ...formData, license_plate: '', brand: '' }); // Reset cơ bản
            fetchBuses();
        } catch (err) {
            alert(err.response?.data?.msg || "Lỗi khi tạo xe");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
        try {
            await api.delete(`/admin/buses/${id}`);
            fetchBuses();
        } catch (err) {
            alert(err.response?.data?.msg || "Không thể xóa xe");
        }
    };

    // Render sơ đồ ghế demo (Preview)
    const renderSeatMapPreview = () => {
        const rows = parseInt(formData.rows) || 0;
        const cols = parseInt(formData.cols) || 0;
        const aisle = parseInt(formData.aisle) || 0;

        return (
            <div className="mt-4 p-4 border rounded bg-slate-50 flex flex-col gap-2 items-center">
                <p className="text-sm font-medium mb-2 py-2">Preview Sơ đồ ghế</p>
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex gap-2">
                        {Array.from({ length: cols }).map((_, c) => (
                            <div key={c} className={`flex items-center justify-center ${c === aisle ? 'ml-4' : ''}`}>
                                <div className="w-8 h-8 bg-indigo-100 rounded border border-indigo-300 flex items-center justify-center text-xs text-indigo-700">
                                    {String.fromCharCode(65 + r)}{c + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form tạo xe */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Thêm Xe Mới & Cấu hình Ghế</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="py-2">Biển số xe</Label>
                            <Input value={formData.license_plate} onChange={e => setFormData({ ...formData, license_plate: e.target.value })} required placeholder="Ví dụ: 51B-123.45" />
                        </div>
                        <div>
                            <Label className="py-2">Nhà xe / Thương hiệu</Label>
                            <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required placeholder="Phương Trang" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="py-2">Số ghế</Label>
                                <Input type="number" value={formData.seat_capacity} onChange={e => setFormData({ ...formData, seat_capacity: e.target.value })} required />
                            </div>
                            <div>
                                <Label className="py-2">Loại xe</Label>
                                <select className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Sleeper">Giường nằm</option>
                                    <option value="Seater">Ghế ngồi</option>
                                    <option value="Limousine">Limousine</option>
                                </select>
                            </div>
                        </div>

                        {/* Seat Map Configuration Tool */}
                        <div className="border-t pt-4">
                            <Label className="text-indigo-600">Cấu hình Sơ đồ ghế</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div>
                                    <Label className="text-xs py-2">Số hàng</Label>
                                    <Input type="number" value={formData.rows} onChange={e => setFormData({ ...formData, rows: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs py-2">Số cột</Label>
                                    <Input type="number" value={formData.cols} onChange={e => setFormData({ ...formData, cols: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs py-2">Vị trí lối đi</Label>
                                    <Input type="number" value={formData.aisle} onChange={e => setFormData({ ...formData, aisle: e.target.value })} />
                                </div>
                            </div>
                            {renderSeatMapPreview()}
                        </div>

                        <div>
                            <Label className="py-2">Tiện ích (phân cách dấu phẩy)</Label>
                            <Input value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="Wifi, TV, USB" />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Thêm Xe</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Danh sách xe */}
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Danh sách xe hiện có</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {buses.map(bus => (
                            <div key={bus.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-full">
                                        <Armchair className="h-6 w-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{bus.license_plate}</h3>
                                        <p className="text-sm text-muted-foreground">{bus.brand} - {bus.type} ({bus.seat_capacity} chỗ)</p>
                                        <div className="flex gap-1 mt-1">
                                            {bus.amenities && bus.amenities.map((a, i) => (
                                                <span key={i} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(bus.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}