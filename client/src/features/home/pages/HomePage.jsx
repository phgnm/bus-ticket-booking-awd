import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, Bus } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-50/50">
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
                            VexereClone <br />
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
            

            <ChatWidget />
        </div>
    );
}