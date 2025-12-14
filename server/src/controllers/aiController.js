const aiService = require('../services/aiService');

exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                msg: 'Invalid messages format'
            });

        }
        
        const reply = await aiService.chat(messages);

        res.json({
            success: true,
            reply: reply
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi Chatbot' });
    }
}