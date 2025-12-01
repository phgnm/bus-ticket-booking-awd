import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TripManagement() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Chuyến đi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Lịch trình chuyến đi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-muted-foreground">Chức năng quản lý chuyến đi đang được phát triển...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}