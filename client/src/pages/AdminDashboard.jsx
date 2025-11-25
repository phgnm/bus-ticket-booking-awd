import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Bus, Users, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        totalBookings: 0,
        activeBuses: 0
    });

    useEffect(() => {
        api.get('/admin/stats')
            .then(res => {
                if (res.data.success) {
                    setStats(res.data.data);
                }
            })
            .catch(err => console.error("Failed to fetch admin stats", err));
    }, []);

    // Component con cho thẻ thống kê
    const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="overflow-hidden border-none shadow-lg">
                <div className={`p-6 flex items-center justify-between ${colorClass} text-white`}>
                    <div>
                        <p className="text-sm font-medium opacity-80">{title}</p>
                        <h3 className="text-3xl font-bold mt-1">{value}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
                <div className="bg-white p-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium mr-1">+12%</span>
                        so với tháng trước
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h1>
                        <p className="text-muted-foreground mt-1">Chào mừng trở lại, Admin! Đây là báo cáo hôm nay.</p>
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground bg-white px-4 py-2 rounded-full border shadow-sm">
                        Cập nhật lần cuối: Vừa xong
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Tổng doanh thu"
                        value={`${stats.revenue.toLocaleString()} đ`}
                        icon={DollarSign}
                        colorClass="bg-gradient-to-br from-indigo-500 to-purple-600"
                        delay={0.1}
                    />
                    <StatCard
                        title="Tổng đơn hàng"
                        value={stats.totalBookings}
                        icon={ShoppingBag}
                        colorClass="bg-gradient-to-br from-blue-500 to-cyan-500"
                        delay={0.2}
                    />
                    <StatCard
                        title="Xe đang hoạt động"
                        value={stats.activeBuses}
                        icon={Bus}
                        colorClass="bg-gradient-to-br from-orange-400 to-pink-500"
                        delay={0.3}
                    />
                </div>

                {/* Mock Recent Activity Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid gap-6 md:grid-cols-2"
                >
                    <Card className="col-span-2 lg:col-span-1 shadow-md border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Hoạt động gần đây
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">Nguyễn Văn {String.fromCharCode(65 + i)} vừa đặt vé</p>
                                            <p className="text-xs text-slate-500">Sài Gòn - Đà Lạt • 2 phút trước</p>
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Mới</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for Chart */}
                    <Card className="col-span-2 lg:col-span-1 shadow-md border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                Khách hàng mới
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[250px] bg-slate-50/50 rounded-lg border border-dashed mx-6 mb-6">
                            <p className="text-muted-foreground text-sm">Biểu đồ tăng trưởng người dùng (Coming Soon)</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}