import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Giả định bạn đã có component này
import { Star, Loader2, Bus, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createReview } from '@/lib/api';

export default function ReviewDialog({ open, onOpenChange, booking, onSuccess }) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [resultStatus, setResultStatus] = useState(null); // 'success' hoặc 'error'
    const [resultMessage, setResultMessage] = useState('');

    // Reset form khi đóng/mở dialog
    useEffect(() => {
        if (open) {
            setRating(0);
            setComment('');
            setHoverRating(0);
            setShowResultDialog(false);
            setResultStatus(null);
            setResultMessage('');
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
                setResultStatus('success');
                setResultMessage('Cảm ơn bạn đã chia sẻ trải nghiệm của mình!');
                setShowResultDialog(true);

                // Đợi 1.5 giây rồi đóng cả 2 dialog
                setTimeout(() => {
                    onSuccess(); // Callback để refresh dữ liệu nếu cần
                    onOpenChange(false); // Đóng dialog đánh giá
                    setShowResultDialog(false);
                }, 1500);
            }
        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);
            setResultStatus('error');
            setResultMessage(error.response?.data?.msg || "Có lỗi xảy ra, vui lòng thử lại sau.");
            setShowResultDialog(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
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

            {/* Result Dialog */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {resultStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    <span className="text-green-600">Đánh giá thành công!</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-6 h-6 text-red-600" />
                                    <span className="text-red-600">Đánh giá thất bại!</span>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 text-center">
                        <p className="text-slate-700">{resultMessage}</p>
                    </div>

                    {resultStatus === 'error' && (
                        <DialogFooter>
                            <Button
                                onClick={() => setShowResultDialog(false)}
                                className="w-full"
                            >
                                Đóng
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}