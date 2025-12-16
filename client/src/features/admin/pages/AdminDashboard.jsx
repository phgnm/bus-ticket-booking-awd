import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    ShoppingBag,
    Bus,
    TrendingUp,
    Percent,
    XCircle,
    MapPin,
    Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch dữ liệu thống kê khi component được mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data.success) {
                    setDashboardData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!dashboardData) return null;

    const {
        revenue,
        totalBookings,
        activeBuses,
        occupancyRate,
        cancelRate,
        revenueChart,
        topRoutes,
        busPerformance
    } = dashboardData;

    // Format tiền tệ VNĐ
    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    // Component thẻ thống kê (Stat Card)
    const StatCard = ({ title, value, icon: Icon, colorClass, subText, subIcon: SubIcon, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className={`p-4 flex items-center justify-between ${colorClass} text-white`}>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    {SubIcon && <SubIcon className="h-4 w-4 text-white/70" />}
                </div>
                <div className="bg-white p-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
                    {subText && (
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                            {subText}
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Quản Trị</h1>
                    <p className="text-slate-500 mt-1">Tổng quan tình hình kinh doanh và vận hành.</p>
                </div>
                <div className="text-xs font-medium bg-white px-3 py-1.5 rounded-md border shadow-sm text-slate-500">
                    Dữ liệu 30 ngày gần nhất
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    title="Doanh thu"
                    value={formatCurrency(revenue)}
                    icon={DollarSign}
                    colorClass="bg-gradient-to-r from-indigo-500 to-purple-600"
                    subText="Tổng doanh thu thực tế"
                    delay={0.1}
                />
                <StatCard
                    title="Đơn hàng"
                    value={totalBookings}
                    icon={ShoppingBag}
                    colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
                    subText="Vé đã thanh toán"
                    delay={0.2}
                />
                <StatCard
                    title="Tỷ lệ lấp đầy"
                    value={`${occupancyRate}%`}
                    icon={Percent}
                    colorClass="bg-gradient-to-r from-emerald-500 to-teal-500"
                    subText="Trung bình mỗi chuyến"
                    delay={0.3}
                />
                <StatCard
                    title="Tỷ lệ hủy"
                    value={`${cancelRate}%`}
                    icon={XCircle}
                    colorClass="bg-gradient-to-r from-rose-500 to-pink-500"
                    subText="Trên tổng số booking"
                    delay={0.4}
                />
                <StatCard
                    title="Xe hoạt động"
                    value={activeBuses}
                    icon={Bus}
                    colorClass="bg-gradient-to-r from-orange-500 to-amber-500"
                    subText="Đang chạy tuyến"
                    delay={0.5}
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Chart - Takes up 2/3 width */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                >
                    <Card className="h-full shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                                Biểu đồ doanh thu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        name="Doanh thu"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Routes - Takes up 1/3 width */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="h-full shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-rose-500" />
                                Tuyến đường phổ biến
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto pr-2">
                            <div className="space-y-4">
                                {topRoutes.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                                ) : (
                                    topRoutes.map((route, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 text-sm">{route.route_name}</span>
                                                <span className="text-xs text-slate-500 mt-1">{route.ticket_count} vé đã bán</span>
                                            </div>
                                            <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-200">
                                                {formatCurrency(route.revenue)}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Bus Performance Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Hiệu quả hoạt động xe (Top 5)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {busPerformance.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu vận hành xe</p>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={busPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="license_plate" type="category" width={80} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                cursor={{ fill: '#f8fafc' }}
                                            />
                                            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Doanh thu" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    {busPerformance.map((bus, idx) => (
                                        <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 
                                                ${idx === 0 ? 'bg-amber-100 text-amber-600' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                #{idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800">{bus.license_plate}</p>
                                                <p className="text-xs text-slate-500">{bus.trip_count} chuyến đi hoàn thành</p>
                                            </div>
                                            <div className="font-semibold text-slate-700">
                                                {formatCurrency(bus.revenue)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}