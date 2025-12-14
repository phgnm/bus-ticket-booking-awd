require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;

if (!process.env.GEMINI_API_KEY) {
    console.warn(`⚠️ WARNING: GEMINI_API_KEY is missing in .env.`);
    // Mock model to prevent crash
    model = {
        startChat: () => ({
            sendMessage: async () => ({
                response: {
                    text: () => "AI functionality is disabled due to missing API key.",
                    candidates: [],
                    functionCalls: () => []
                }
            })
        })
    };
} else {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Bạn là trợ lý ảo của hệ thống Bus Ticket Booking.
            Nhiệm vụ: Giúp khách tìm chuyến xe và giải đáp thắc mắc vé.
            Phong cách: Thân thiện, ngắn gọn, trả lời bằng tiếng Việt.
            Hôm nay là: ${new Date().toISOString().split('T')[0]}.`
        });
    } catch (error) {
        console.error("❌ Gemini Initialization Error:", error);
        model = {
            startChat: () => ({
                sendMessage: async () => ({
                    response: {
                        text: () => "AI functionality is temporarily unavailable.",
                        candidates: [],
                        functionCalls: () => []
                    }
                })
            })
        };
    }
}

module.exports = model;
