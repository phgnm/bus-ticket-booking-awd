import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Giả định bạn đã có component này
import { Star, Loader2, Bus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createReview } from '@/lib/api';

export default function ReviewDialog({ open, onOpenChange, booking, onSuccess }) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form khi đóng/mở dialog
    useEffect(() => {
        if (open) {
            setRating(0);
            setComment('');
            setHoverRating(0);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                variant: "destructive",
                title: "Vui lòng chọn số sao",
                description: "Bạn cần đánh giá ít nhất 1 sao."
            });
            return;
        }

        // Kiểm tra trip_id
        if (!booking?.trip_id) {
            console.error("Booking data:", booking);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không tìm thấy thông tin chuyến đi. Vui lòng thử lại."
            });
            return;
        }

        try {
            setIsSubmitting(true);

            // Gọi API
            const payload = {
                tripId: parseInt(booking.trip_id), // Đảm bảo tripId là số nguyên
                rating: rating,
                comment: comment || "" // Đảm bảo comment là chuỗi
            };

            console.log("Sending review payload:", payload);
            const res = await createReview(payload);

            if (res.success) {
                toast({
                    title: "Đánh giá thành công!",
                    description: "Cảm ơn bạn đã chia sẻ trải nghiệm.",
                    className: "bg-green-50 border-green-200 text-green-800"
                });
                onSuccess(); // Callback để refresh dữ liệu nếu cần
                onOpenChange(false); // Đóng dialog
            }
        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);
            toast({
                variant: "destructive",
                title: "Gửi đánh giá thất bại",
                description: error.response?.data?.msg || "Có lỗi xảy ra, vui lòng thử lại sau."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-indigo-600" />
                        Đánh giá chuyến đi
                    </DialogTitle>
                    <DialogDescription>
                        Chia sẻ trải nghiệm của bạn về chuyến đi từ <strong>{booking?.from_loc}</strong> đến <strong>{booking?.to_loc}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Chọn sao */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Chất lượng chuyến đi</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-slate-500 h-4">
                            {hoverRating || rating ?
                                (hoverRating || rating) === 5 ? "Tuyệt vời" :
                                    (hoverRating || rating) === 4 ? "Rất tốt" :
                                        (hoverRating || rating) === 3 ? "Bình thường" :
                                            (hoverRating || rating) === 2 ? "Tệ" : "Rất tệ"
                                : ""}
                        </span>
                    </div>

                    {/* Nhập nội dung */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nhận xét của bạn (tùy chọn)</label>
                        <Textarea
                            placeholder="Tài xế thân thiện, xe sạch sẽ..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gửi đánh giá
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}