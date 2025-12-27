const aiService = require('../services/aiService');

exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid messages format. Expected array of messages.'
            });
        }

        if (messages.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Messages array cannot be empty.'
            });
        }

        const reply = await aiService.chat(messages);

        res.json({
            success: true,
            reply: reply
        });
    }
    catch (err) {
        console.error('❌ AI Controller Error:', err);
        res.status(500).json({
            success: false,
            msg: 'Lỗi Chatbot: ' + (err.message || 'Unknown error')
        });
    }
}