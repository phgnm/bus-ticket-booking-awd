require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    console.warn(`⚠️ WARNING: GEMINI_API_KEY is missing in .env.`);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `Bạn là trợ lý ảo của hệ thống Bus Ticket Booking. 
    Nhiệm vụ: Giúp khách tìm chuyến xe và giải đáp thắc mắc vé.
    Phong cách: Thân thiện, ngắn gọn, trả lời bằng tiếng Việt.
    Hôm nay là: ${new Date().toISOString().split('T')[0]}.`
});

module.exports = model;