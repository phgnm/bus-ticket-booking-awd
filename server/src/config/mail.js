require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Skip verification in test environment to avoid ECONNREFUSED
if (process.env.NODE_ENV !== 'test') {
    transporter.verify((error) => {
        if (error) {
            console.error('❌ Lỗi kết nối Email Service:', error);
        } else {
            console.log('✅ Email Service đã sẵn sàng');
        }
    });
}

module.exports = transporter;
