const model = require('../config/gemini');
const tripService = require('./tripService');
const locationRepository = require('../repositories/locationRepository');
const LOCATION_ALIAS = require('../constants/locationAliases')

class AIService {
    // tool definition
    tools = [
        {
            functionDeclarations: [
                {
                    name: "search_trips",
                    description: "Tìm kiếm chuyến xe khách dựa trên điểm đi, điểm đến và ngày khởi hành.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            from: { type: "STRING", description: "Tên thành phố/địa điểm đi (VD: Hà Nội, Sài Gòn)" },
                            to: { type: "STRING", description: "Tên thành phố/địa điểm đến (VD: Đà Nẵng, Đà Lạt)" },
                            date: { type: "STRING", description: "Ngày khởi hành định dạng YYYY-MM-DD" },
                        },
                        required: ["from", "to", "date"],
                    },
                }
            ],
        },
    ];

    _normalizeName(rawName) {
        if (!rawName) return '';
        const lowerName = rawName.toLowerCase().trim();
        
        // check in alias
        if (LOCATION_ALIAS[lowerName]) {
            return LOCATION_ALIAS[lowerName];
        }
        
        // return original name if no alias is found
        return rawName;
    }

    async chat(messages) {
        try {
            // prepare history
            const history = messages.slice(0, -1).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const lastMessage = messages[messages.length - 1].content;

            // start chat
            const chatSession = model.startChat({
                history: history,
                tools: this.tools,
            });

            // send message
            const result = await chatSession.sendMessage(lastMessage);
            const response = result.response;

            
            // take list of function calls
            const functionCalls = response.functionCalls();

            // handle function calling
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                
                if (call.name === 'search_trips') {
                    console.log("🤖 Gemini đang gọi hàm search_trips với tham số:", call.args);
                    
                    // send execution code
                    const searchResult = await this._executeSearchTrips(call.args);
                    console.log("🔍 Kết quả tìm kiếm DB:", JSON.stringify(searchResult));

                    // send result to AI
                    const finalResult = await chatSession.sendMessage([
                        {
                            functionResponse: {
                                name: 'search_trips',
                                response: {
                                    name: 'search_trips',
                                    content: searchResult 
                                }
                            }
                        }
                    ]);
                    
                    const finalReply = finalResult.response.text();
                    console.log("✅ AI Reply sau khi gọi hàm:", finalReply);
                    return finalReply;
                }
            }

            // check if there's text available
            if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
                const textPart = response.candidates[0].content.parts.find(p => p.text);
                if (textPart) {
                    return textPart.text;
                }
            }

            // send default text if empty
            console.warn("⚠️ AI trả về rỗng. FinishReason:", response.candidates?.[0]?.finishReason);
            return "Xin lỗi, tôi không hiểu ý bạn hoặc hệ thống đang gặp sự cố.";

        } catch (err) {
            console.error('❌ Gemini Critical Error:', err);
            return "Xin lỗi, hệ thống AI đang quá tải. Vui lòng thử lại sau.";
        }
    }

    async _executeSearchTrips({ from, to, date }) {
        try {
            const fromTerm = this._normalizeName(from);
            const toTerm = this._normalizeName(to);

            // find in db
            const fromLocs = await locationRepository.findAll(fromTerm);
            const toLocs = await locationRepository.findAll(toTerm);

            if (fromLocs.length === 0) return { error: `Không tìm thấy địa điểm đi: '${from}' (hệ thống hiểu là '${fromTerm}').` };
            if (toLocs.length === 0) return { error: `Không tìm thấy địa điểm đến: '${to}' (hệ thống hiểu là '${toTerm}').` };

            const result = await tripService.searchTrips({
                from: fromLocs[0].id,
                to: toLocs[0].id,
                date: date,
                limit: 5
            });

            if (result.data.length === 0) return { info: 'Không tìm thấy chuyến xe nào phù hợp.' };

            return {
                ket_qua: result.data.map(t => ({
                    nha_xe: t.brand,
                    gio_di: t.departure_time,
                    gia_ve: t.price_base,
                    ghe_trong: t.available_seats
                }))
            };

        } catch (err) {
            console.error("❌ Lỗi trong hàm _executeSearchTrips:", err);
            return { error: 'Lỗi hệ thống khi tìm kiếm: ' + err.message };
        }
    }
}

module.exports = new AIService();