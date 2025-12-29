const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const seedAdmin = async () => {
    try {
        console.log('⏳ Checking/Seeding default users...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Seed admin user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash, is_verified = TRUE`,
            ['admin@vexere.com', hashedPassword, 'System Administrator', 'admin', true]
        );
        console.log('✅ Admin user ready (admin@vexere.com / admin123)');

        // Seed test user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash, is_verified = TRUE`,
            ['user1@vexere.com', hashedPassword, 'Test User', 'user', true]
        );
        console.log('✅ Test user ready (user1@vexere.com / admin123)');
    } catch (err) {
        console.error('❌ Error seeding users:', err);
    }
};

module.exports = seedAdmin;