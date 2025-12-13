const payosLib = require("@payos/node");

// Vẫn giữ logic lấy Class an toàn này cho Node v22
const PayOS = payosLib.PayOS || payosLib.default || payosLib;

// Use dummy values if env vars are missing to allow server/tests to start
const clientId = process.env.PAYOS_CLIENT_ID || 'DUMMY_CLIENT_ID';
const apiKey = process.env.PAYOS_API_KEY || 'DUMMY_API_KEY';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'DUMMY_CHECKSUM_KEY';

if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.warn("⚠️ [ENV WARNING] Thiếu biến môi trường PAYOS. Sử dụng giá trị giả lập.");
}

const payos = new PayOS({
    clientId,
    apiKey,
    checksumKey
});

module.exports = payos;
