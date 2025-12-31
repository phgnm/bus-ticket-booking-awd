import { Outlet } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from '@/components/shared/Navbar';

export default function UserLayout() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="user-ui-theme">
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </ThemeProvider>
    );
}
