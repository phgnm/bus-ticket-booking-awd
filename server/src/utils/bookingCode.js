const crypto = require('crypto');

const generateBookingCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Bỏ 0, 1, I, O
    let code = '';
    const bytes = crypto.randomBytes(5); 
    
    for (let i = 0; i < 5; i++) {
        code += chars[bytes[i] % chars.length];
    }

    return `VEX-${code}`;
};

module.exports = { generateBookingCode };