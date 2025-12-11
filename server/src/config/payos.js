const payosLib = require("@payos/node");

// Vẫn giữ logic lấy Class an toàn này cho Node v22
const PayOS = payosLib.PayOS || payosLib.default || payosLib;

if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.error("❌ [ENV ERROR] Thiếu biến môi trường PAYOS.");
}

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payos;