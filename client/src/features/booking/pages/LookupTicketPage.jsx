import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TicketView from '@/components/shared/TicketView';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LookupTicketPage() {
    const [formData, setFormData] = useState({ code: '', email: '' });
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setBooking(null);

        try {
            const res = await api.get('/bookings/lookup', {
                params: {
                    code: formData.code.trim(),
                    email: formData.email.trim()
                }
            });

            if (res.data.success) {
                setBooking(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.msg || "Không tìm thấy thông tin vé hoặc lỗi hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
            <Card className="w-full max-w-md mb-8">
                <CardHeader>
                    <CardTitle className="text-center text-2xl text-indigo-700">Tra cứu vé xe</CardTitle>
                    <CardDescription className="text-center">Nhập mã vé và email đặt vé để xem thông tin</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Mã vé (VD: VEX-12345)</Label>
                            <Input
                                id="code"
                                placeholder="Nhập mã vé..."
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email đặt vé</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Nhập email..."
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Tra cứu
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {booking && (
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4">
                    <TicketView booking={booking} />
                </div>
            )}
        </div>
    );
}