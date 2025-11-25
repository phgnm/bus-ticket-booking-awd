import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

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

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-900 py-20 sm:py-32">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/60 to-slate-900" />
                
                <div className="container relative mx-auto px-4 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-200"
                    >
                        Đặt vé xe buýt <br/>
                        <span className="text-indigo-400">Dễ dàng & Tiện lợi</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-6 max-w-2xl text-lg text-slate-300"
                    >
                        Hệ thống đặt vé trực tuyến hàng đầu. Kết nối hàng triệu hành khách với những chuyến đi an toàn và chất lượng mỗi ngày.
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-10 flex justify-center gap-4"
                    >
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 rounded-full px-8">
                            Tìm chuyến ngay <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-black border-slate-700 hover:bg-slate-800 rounded-full">
                            Tìm hiểu thêm
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* User History Section */}
            {user && (
                <section className="container mx-auto p-4 sm:p-8 -mt-16 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Lịch sử chuyến đi của bạn</h2>
                        <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">Xem tất cả</Button>
                    </div>
                    
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {history.length > 0 ? (
                            history.map((itemData, index) => (
                                <motion.div key={index} variants={item}>
                                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 overflow-hidden bg-white/80 backdrop-blur-sm">
                                        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                                <MapPin className="h-5 w-5 text-indigo-500" />
                                                {itemData.trip}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col gap-3 mt-2">
                                                <div className="flex items-center text-sm text-slate-500">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {itemData.date}
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trạng thái</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        itemData.status === 'Completed' 
                                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {itemData.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-slate-500 col-span-full text-center py-10 bg-white rounded-lg border border-dashed border-slate-300">
                                Bạn chưa có chuyến đi nào. Hãy đặt vé ngay!
                            </p>
                        )}
                    </motion.div>
                </section>
            )}
        </div>
    );
}