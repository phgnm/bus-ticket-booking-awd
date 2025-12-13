import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import TicketView from '@/components/shared/TicketView';
import { Download, Home, Loader2, ArrowRight } from 'lucide-react';

export default function BookingSuccessPage() {
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const { user } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTicket = async () => {
            if (!code) return;

            // Thử lấy email từ user login hoặc session storage (lưu lúc booking)
            // Bạn cần cập nhật BookingPage.jsx để lưu email vào sessionStorage khi submit thành công
            const sessionEmail = sessionStorage.getItem('last_booking_email');
            const emailToUse = user?.email || sessionEmail;

            if (!emailToUse) {
                // Nếu không có email, không thể lookup chi tiết -> Chỉ hiện mã code đơn giản
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/bookings/lookup', {
                    params: { code: code, email: emailToUse }
                });
                if (res.data.success) {
                    setBooking(res.data.data);
                }
            } catch (err) {
                console.error("Lỗi lấy vé:", err);
                setError("Không thể tải thông tin chi tiết vé.");
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [code, user]);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt vé thành công!</h1>
                <p className="text-gray-600">Mã vé của bạn là <span className="font-bold text-indigo-600 font-mono text-lg">{code}</span></p>
            </div>

            {loading ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : booking ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TicketView booking={booking} />

                    <div className="flex justify-center gap-4 mt-8">
                        {/* Nút download hiện tại chỉ là mockup vì BE chưa có endpoint download PDF trực tiếp */}
                        <Button variant="outline" onClick={() => window.print()}>
                            <Download className="w-4 h-4 mr-2" /> In / Lưu Vé
                        </Button>
                        <Link to="/">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                <Home className="w-4 h-4 mr-2" /> Về trang chủ
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow text-center">
                    <p className="mb-4 text-gray-500">Chúng tôi đã gửi thông tin vé về email của bạn.</p>
                    <Link to="/lookup-ticket">
                        <Button variant="link" className="text-indigo-600">
                            Tra cứu chi tiết vé tại đây <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}