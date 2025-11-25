import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HomePage() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (user) {
            api.get('/user/history')
                .then(res => setHistory(res.data.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    return (
        <div className="container mx-auto p-4 space-y-8">
            {/* Banner */}
            <section className="rounded-lg bg-primary/10 p-12 text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">Đặt vé xe buýt dễ dàng</h1>
                <p className="text-lg text-muted-foreground">Hệ thống đặt vé trực tuyến nhanh chóng, tiện lợi.</p>
            </section>

            {/* User History Widget */}
            {user && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4">Lịch sử chuyến đi của bạn</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {history.length > 0 ? (
                            history.map((item, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{item.trip}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between text-sm">
                                            <span>Ngày: {item.date}</span>
                                            <span className={`font-medium ${item.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-muted-foreground">Bạn chưa có chuyến đi nào.</p>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}