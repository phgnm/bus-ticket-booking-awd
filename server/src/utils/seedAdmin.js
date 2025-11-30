const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Insert admin user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO NOTHING`,
            ['admin@vexere.com', hashedPassword, 'Admin User', 'admin', true]
        );

        console.log('Admin user seeded successfully');
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        pool.end();
    }
})();
