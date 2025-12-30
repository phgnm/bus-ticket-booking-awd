import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Eye, Trash2, CheckCircle, Ban, Search,
    Filter, RefreshCcw, Star, Calendar
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Enums & Constants
const REVIEW_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    HIDDEN: 'HIDDEN'
};

const STATUS_COLORS = {
    [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [REVIEW_STATUS.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
    [REVIEW_STATUS.HIDDEN]: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ReviewManagement() {
    // --- State ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        rating: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // Modal State
    const [selectedReview, setSelectedReview] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const { toast } = useToast();

    // --- Fetch Data ---
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await reviewService.getReviews({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });
            if (res.success) {
                setReviews(res.data);
                // Giả sử API trả về meta cho pagination, nếu không thì cần điều chỉnh
                setPagination(prev => ({ ...prev, totalPages: res.totalPages || 1 }));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Lỗi tải dữ liệu", description: "Không thể lấy danh sách đánh giá." });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters, toast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // --- Handlers ---
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset về trang 1 khi filter
    };

    const resetFilters = () => {
        setFilters({ search: '', rating: '', status: '', startDate: '', endDate: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Optimistic Update Helper
    const updateLocalReview = (id, updates) => {
        setReviews(prev => prev.map(r => r.review_id === id ? { ...r, ...updates } : r));
    };

    const handleAction = async (action, review) => {
        try {
            if (action === 'APPROVE') {
                updateLocalReview(review.review_id, { status: REVIEW_STATUS.APPROVED }); // Optimistic
                await reviewService.updateStatus(review.review_id, REVIEW_STATUS.APPROVED);
                toast({ title: "Đã duyệt", description: "Đánh giá đã được hiển thị công khai." });
            } else if (action === 'HIDE') {
                updateLocalReview(review.review_id, { status: REVIEW_STATUS.HIDDEN }); // Optimistic
                await reviewService.updateStatus(review.review_id, REVIEW_STATUS.HIDDEN);
                toast({ title: "Đã ẩn", description: "Đánh giá đã bị ẩn khỏi hệ thống." });
            } else if (action === 'DELETE') {
                setSelectedReview(review);
                setIsDeleteAlertOpen(true);
            } else if (action === 'VIEW') {
                setSelectedReview(review);
                setIsViewOpen(true);
            }
        } catch (error) {
            fetchReviews(); // Revert on error
            toast({ variant: "destructive", title: "Thao tác thất bại", description: error.message });
        }
    };

    const confirmDelete = async () => {
        if (!selectedReview) return;
        try {
            await reviewService.deleteReview(selectedReview.review_id);
            setReviews(prev => prev.filter(r => r.review_id !== selectedReview.review_id));
            toast({ title: "Đã xóa", description: "Đánh giá đã bị xóa vĩnh viễn." });
        } catch (error) {
            toast({ variant: "destructive", title: "Lỗi xóa", description: error.message });
        } finally {
            setIsDeleteAlertOpen(false);
            setSelectedReview(null);
        }
    };

    // --- Components ---
    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đánh giá</h1>
                    <p className="text-sm text-muted-foreground">Kiểm duyệt ý kiến khách hàng về chuyến đi.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchReviews}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo nội dung..."
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value={REVIEW_STATUS.PENDING}>Chờ duyệt</option>
                            <option value={REVIEW_STATUS.APPROVED}>Đã duyệt</option>
                            <option value={REVIEW_STATUS.HIDDEN}>Đã ẩn</option>
                        </select>

                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={filters.rating}
                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                        >
                            <option value="">Tất cả sao</option>
                            <option value="5">5 Sao</option>
                            <option value="4">4 Sao</option>
                            <option value="3">3 Sao</option>
                            <option value="2">2 Sao</option>
                            <option value="1">1 Sao</option>
                        </select>

                        <div className="flex gap-2 lg:col-span-2">
                            {/* Simple Date Inputs for filtering */}
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full"
                            />
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full"
                            />
                            <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset Filter">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Table */}
            <Card className="overflow-hidden border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-[80px]">Mã Vé</th>
                                <th className="px-4 py-3 min-w-[150px]">Chuyến đi</th>
                                <th className="px-4 py-3 w-[120px]">Đánh giá</th>
                                <th className="px-4 py-3">Nội dung</th>
                                <th className="px-4 py-3 w-[150px]">Ngày tạo</th>
                                <th className="px-4 py-3 text-right w-[140px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                // Skeleton Loading
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                ))
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="h-8 w-8 text-slate-300 mb-2" />
                                            <p>Không tìm thấy đánh giá nào phù hợp.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr
                                        key={review.review_id}
                                        className={`hover:bg-slate-50 transition-colors ${review.rating <= 2 ? 'bg-red-50/50 hover:bg-red-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">#{review.booking_id}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{review.route_name || 'SG - ĐL'}</div>
                                            <div className="text-xs text-slate-500">{review.bus_plate}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {renderStars(review.rating)}
                                        </td>
                                        <td className="px-4 py-3 max-w-[300px]">
                                            <div className="truncate" title={review.comment}>
                                                {review.comment}
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-slate-500">
                                            {review.created_at ? format(new Date(review.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleAction('VIEW', review)}
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>


                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleAction('DELETE', review)}
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && reviews.length > 0 && (
                    <div className="bg-slate-50 px-4 py-3 border-t flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline" size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* View Detail Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đánh giá #{selectedReview?.booking_id}</DialogTitle>
                    </DialogHeader>
                    {selectedReview && (
                        <div className="space-y-4 py-2">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Khách hàng</p>
                                    <p className="font-semibold">{selectedReview.user_name || 'Ẩn danh'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-500">Ngày đi</p>
                                    <p className="font-semibold">{selectedReview.trip_date ? format(new Date(selectedReview.trip_date), 'dd/MM/yyyy') : '-'}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-slate-700">Đánh giá:</span>
                                    {renderStars(selectedReview.rating)}
                                    <span className="text-slate-500 text-sm">({selectedReview.rating}/5)</span>
                                </div>
                                <div className="p-4 border rounded-lg bg-white text-slate-700 italic relative">
                                    <span className="absolute top-2 left-2 text-4xl text-slate-200 font-serif">"</span>
                                    <p className="relative z-10 px-2">{selectedReview.comment}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsViewOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa đánh giá</DialogTitle>
                        <DialogDescription>
                            Hành động này không thể hoàn tác. Đánh giá này sẽ bị xóa khỏi hệ thống vĩnh viễn.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteAlertOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Xóa ngay</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}