const app = require('./app');
const pool = require('./config/db'); // Import kết nối DB
const bcrypt = require('bcryptjs'); // Import để hash mật khẩu
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Hàm tạo Admin mặc định
const createDefaultAdmin = async () => {
    // Kiểm tra xem đã có user nào có role = 'admin' chưa
    const checkAdmin = await pool.query(
        "SELECT * FROM users WHERE role = 'admin' LIMIT 1",
    );

    if (checkAdmin.rows.length === 0) {
        const email = 'admin@vexere.com';
        const password = 'admin123'; // Mật khẩu mặc định
        const fullName = 'System Administrator';

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert vào DB
        await pool.query(
            "INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES ($1, $2, $3, 'admin', TRUE)",
            [email, passwordHash, fullName],
        );
    }
};

// Khởi động server và chạy seed
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}`);

    // Chạy hàm seed sau khi server start
    await createDefaultAdmin();
});
