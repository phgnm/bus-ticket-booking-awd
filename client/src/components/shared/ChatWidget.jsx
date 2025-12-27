import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area'; // Nếu chưa có thì dùng div thường
import api from '@/lib/api';
import { cn } from '@/lib/utils'; // Utility để merge class

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Xin chào 👋 Tôi có thể giúp bạn tìm và đặt vé xe.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = { role: 'user', content: inputValue };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Chuẩn bị history để gửi lên server
            const chatHistory = [...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const res = await api.post('/ai/chat', { messages: chatHistory });

            // Kiểm tra response structure
            if (res.data && res.data.success && res.data.reply) {
                const botReply = {
                    role: 'assistant',
                    content: res.data.reply
                };
                setMessages((prev) => [...prev, botReply]);
            } else {
                // Handle case where success is false or reply is missing
                setMessages((prev) => [...prev, {
                    role: 'assistant',
                    content: 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.',
                    isError: true
                }]);
            }
        } catch (error) {
            console.error("Chat error:", error);

            // Better error handling with specific messages
            let errorMessage = 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.';

            if (error.response) {
                // Server responded with error
                if (error.response.status === 500) {
                    errorMessage = 'Lỗi server. Có thể thiếu GEMINI_API_KEY hoặc AI đang quá tải.';
                } else if (error.response.status === 400) {
                    errorMessage = 'Yêu cầu không hợp lệ. Vui lòng thử lại.';
                } else if (error.response.data?.msg) {
                    errorMessage = error.response.data.msg;
                }
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
            }

            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: errorMessage,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* 2.1 Chat Launcher */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            size="icon"
                            className="h-14 w-14 rounded-full bg-indigo-600 shadow-xl hover:bg-indigo-700 relative overflow-visible"
                        >
                            <MessageCircle className="h-7 w-7 text-white" />
                            {/* Pulse animation when idle */}
                            <span className="absolute -inset-1 rounded-full border-2 border-white/30 animate-ping opacity-75"></span>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2.2 Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-md shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Vexere AI</h3>
                                    <p className="text-xs text-indigo-100 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full block"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 text-white rounded-full h-8 w-8"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Message List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, index) => (
                                <MessageItem key={index} message={msg} />
                            ))}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-200 rounded-2xl rounded-tl-none py-2 px-4 flex items-center gap-1">
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    disabled={isLoading}
                                    className="rounded-full bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 w-10 h-10 shrink-0"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </form>
                            <div className="text-[10px] text-center text-slate-400 mt-2">
                                AI có thể đưa ra thông tin không chính xác.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// 🧩 3. Message UI Component
function MessageItem({ message }) {
    const isUser = message.role === 'user';
    const isError = message.isError;

    // Helper: Logic đơn giản để phát hiện nếu tin nhắn chứa thông tin chuyến xe
    // (Lý tưởng nhất là backend trả về JSON, nhưng ở đây ta parse text tạm thời để hiển thị Card)
    // Hiện tại backend của bạn trả về text, nên ta sẽ hiển thị text.
    // Nếu bạn muốn hiển thị card, backend nên trả về 1 flag hoặc structure riêng.
    // Ở đây tôi demo cách hiển thị text đẹp.

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex w-full",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[85%] p-3 text-sm shadow-sm",
                    isUser
                        ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                        : isError
                            ? "bg-red-50 text-red-600 border border-red-100 rounded-2xl rounded-tl-none"
                            : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none"
                )}
            >
                {/* Render Text content with line breaks */}
                <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </div>

                {/* Ví dụ về Trip Suggestions rendered as Cards (Fake Logic based on requirements) */}
                {/* Trong thực tế bạn cần check message.data hoặc parse content */}
                {/* {!isUser && message.content.includes("Found Trip") && (
                    <div className="mt-3 space-y-2">
                         <TripCardMock />
                    </div>
                )} 
                */}
            </div>
        </motion.div>
    );
}

// Mock Component nếu muốn hiển thị Card chuyến xe trong chat
function TripCardMock({ brand, price, time }) {
    return (
        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs">
            <div className="font-bold text-indigo-700">{brand || "Nhà xe Phương Trang"}</div>
            <div className="flex justify-between mt-1 text-slate-500">
                <span>{time || "22:00"}</span>
                <span className="font-semibold text-green-600">{price || "300.000đ"}</span>
            </div>
            <Button size="sm" className="w-full mt-2 h-7 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                Đặt vé
            </Button>
        </div>
    );
}