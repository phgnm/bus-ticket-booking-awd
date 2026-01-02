import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
    MapPin, Calendar, ArrowRight, Bus,
    Shield, Clock, Award, Star, Users,
    Sparkles, TrendingUp, CheckCircle2,
    Phone, Mail, MapPinned
} from 'lucide-react';
import ChatWidget from '@/components/shared/ChatWidget';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Search State
    const [locations, setLocations] = useState([]);
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        date: ''
    });

    useEffect(() => {
        // Fetch locations for autocomplete/select
        api.get('/locations').then(res => {
            if (res.data.success) setLocations(res.data.data);
        });
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        // Redirect to Search Result Page with Query Params
        const query = new URLSearchParams(searchParams).toString();
        navigate(`/search?${query}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-900 py-20 sm:py-28">
                {/* Background & Text ... (Giữ nguyên như cũ) */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/60 to-slate-900" />

                <div className="container relative mx-auto px-4">
                    <div className="text-center mb-10">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-200"
                        >
                            BusGo <br />
                            <span className="text-indigo-400">Kết nối mọi hành trình</span>
                        </motion.h1>
                    </div>

                    {/* === SEARCH INTERFACE === */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-4xl mx-auto"
                    >
                        <Card className="border-0 shadow-2xl">
                            <CardContent className="p-6">
                                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Nơi xuất phát</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={searchParams.from}
                                            onChange={e => setSearchParams({ ...searchParams, from: e.target.value })}
                                            required
                                        >
                                            <option value="">Chọn điểm đi</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Nơi đến</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={searchParams.to}
                                            onChange={e => setSearchParams({ ...searchParams, to: e.target.value })}
                                            required
                                        >
                                            <option value="">Chọn điểm đến</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-green-500" /> Ngày đi</Label>
                                        <Input
                                            type="date"
                                            value={searchParams.date}
                                            onChange={e => setSearchParams({ ...searchParams, date: e.target.value })}
                                            required
                                            className="block w-full"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 text-base">
                                            Tìm chuyến
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Users, label: 'Khách hàng', value: '50,000+', color: 'text-blue-600' },
                            { icon: Bus, label: 'Chuyến xe', value: '1,200+', color: 'text-green-600' },
                            { icon: MapPinned, label: 'Tuyến đường', value: '300+', color: 'text-purple-600' },
                            { icon: Award, label: 'Giải thưởng', value: '15+', color: 'text-orange-600' }
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className={`inline-flex p-4 rounded-full bg-white shadow-lg mb-3`}>
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                                <p className="text-slate-600 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">
                                Tại sao chọn chúng tôi?
                            </h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">
                                Cam kết mang đến trải nghiệm đặt vé xe khách tốt nhất với công nghệ hiện đại
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: 'An toàn & Tin cậy',
                                desc: 'Đối tác chính thức với các nhà xe uy tín, đảm bảo chất lượng dịch vụ',
                                color: 'bg-blue-100 text-blue-600'
                            },
                            {
                                icon: Clock,
                                title: 'Đặt vé nhanh chóng',
                                desc: 'Chỉ 3 bước đơn giản để hoàn tất đặt vé, tiết kiệm thời gian tối đa',
                                color: 'bg-green-100 text-green-600'
                            },
                            {
                                icon: Award,
                                title: 'Giá tốt nhất',
                                desc: 'Cam kết giá vé tốt nhất thị trường, nhiều ưu đãi hấp dẫn',
                                color: 'bg-purple-100 text-purple-600'
                            },
                            {
                                icon: Phone,
                                title: 'Hỗ trợ 24/7',
                                desc: 'Đội ngũ tư vấn viên sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi',
                                color: 'bg-orange-100 text-orange-600'
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Đổi trả linh hoạt',
                                desc: 'Chính sách đổi trả vé linh hoạt, hoàn tiền nhanh chóng',
                                color: 'bg-red-100 text-red-600'
                            },
                            {
                                icon: Sparkles,
                                title: 'Ưu đãi đặc biệt',
                                desc: 'Nhiều chương trình khuyến mãi, tích điểm đổi quà hấp dẫn',
                                color: 'bg-yellow-100 text-yellow-600'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-indigo-500 hover:-translate-y-1">
                                    <CardContent className="p-6 space-y-3">
                                        <div className={`inline-flex p-3 rounded-lg ${feature.color}`}>
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            
           

            {/* Testimonials Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">
                                Khách hàng nói gì về chúng tôi
                            </h2>
                            <p className="text-slate-600">Hàng nghìn đánh giá 5 sao từ khách hàng</p>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: 'Nguyễn Văn A',
                                role: 'Khách hàng thường xuyên',
                                avatar: 'https://i.pravatar.cc/150?img=12',
                                rating: 5,
                                comment: 'Dịch vụ tuyệt vời! Đặt vé nhanh chóng, giá cả hợp lý. Tôi sẽ tiếp tục sử dụng.'
                            },
                            {
                                name: 'Trần Thị B',
                                role: 'Doanh nhân',
                                avatar: 'https://i.pravatar.cc/150?img=45',
                                rating: 5,
                                comment: 'Giao diện dễ sử dụng, thanh toán tiện lợi. Đội ngũ hỗ trợ rất nhiệt tình!'
                            },
                            {
                                name: 'Lê Minh C',
                                role: 'Sinh viên',
                                avatar: 'https://i.pravatar.cc/150?img=33',
                                rating: 5,
                                comment: 'Giá vé sinh viên rất ưu đãi. App chạy mượt mà, recommend cho bạn bè!'
                            }
                        ].map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200"
                                            />
                                            <div>
                                                <h4 className="font-semibold text-slate-800">{testimonial.name}</h4>
                                                <p className="text-sm text-slate-500">{testimonial.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 mb-3">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-slate-600 leading-relaxed italic">
                                            "{testimonial.comment}"
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Bắt đầu hành trình của bạn ngay hôm nay!
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Hơn 50,000 khách hàng tin tưởng sử dụng dịch vụ của chúng tôi
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Button
                                size="lg"
                                className="bg-white text-indigo-600 hover:bg-blue-50 font-semibold px-8"
                                onClick={() => navigate('/search')}
                            >
                                Tìm chuyến xe ngay
                            </Button>
                            {!user && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8"
                                    onClick={() => navigate('/register')}
                                >
                                    Đăng ký miễn phí
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>


            <ChatWidget />
        </div>
    );
}