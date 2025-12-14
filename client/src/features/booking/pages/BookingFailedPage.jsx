import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";

export default function BookingFailedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50/30 p-4">
            <Card className="w-full max-w-md shadow-lg border-red-200">
                <CardHeader className="text-center flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-700">Thanh toán thất bại</CardTitle>
                    <CardDescription>
                        Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý.
                    </CardDescription>
                </CardHeader>

                <CardContent className="text-center text-gray-600 space-y-4">
                    <p>
                        Bạn chưa bị trừ tiền cho giao dịch này (hoặc sẽ được hoàn tiền nếu có lỗi hệ thống).
                    </p>
                    <p className="text-sm">
                        Vui lòng thử đặt lại vé hoặc chọn phương thức thanh toán khác.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3">
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => navigate('/search')}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Đặt lại vé ngay
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-gray-600 hover:text-gray-900"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Về trang chủ
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};