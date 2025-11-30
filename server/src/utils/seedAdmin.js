const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
    try {
        console.log('Seeding users...');
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Insert admin user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash, is_verified = TRUE`,
            [
                'admin@vexere.com',
                hashedPassword,
                'System Administrator',
                'admin',
                true,
            ],
        );
        console.log('Admin user seeded successfully');

        // Insert test user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash, is_verified = TRUE`,
            ['user1@vexere.com', hashedPassword, 'Test User', 'user', true],
        );
        console.log('Test user seeded successfully');
    } catch (err) {
        console.error('Error seeding users:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
