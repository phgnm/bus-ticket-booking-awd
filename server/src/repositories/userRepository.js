const pool = require('../config/db');

class UserRepository {
    // --- USER CRUD ---
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email],
        );
        return result.rows[0];
    }

    async create(userData) {
        const {
            email,
            passwordHash,
            fullName,
            role,
            verificationToken,
            isVerified,
        } = userData;
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role, verification_token, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
            [
                email,
                passwordHash,
                fullName,
                role,
                verificationToken,
                isVerified,
            ],
        );
        return result.rows[0];
    }

    async findByVerificationToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE verification_token = $1',
            [token],
        );
        return result.rows[0];
    }

    async verifyUser(userId) {
        await pool.query(
            'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
            [userId],
        );
    }

    async updatePassword(userId, passwordHash) {
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
            passwordHash,
            userId,
        ]);
    }

    // --- GOOGLE AUTH ---
    async findByEmailOrGoogleId(email, googleId) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR google_id = $2',
            [email, googleId],
        );
        return result.rows[0];
    }

    async createGoogleUser(email, fullName, googleId) {
        const result = await pool.query(
            'INSERT INTO users (email, full_name, google_id, is_verified) VALUES ($1, $2, $3, true) RETURNING id, email, role',
            [email, fullName, googleId],
        );
        return result.rows[0];
    }

    // --- REFRESH TOKEN ---
    async addRefreshToken(token, userId) {
        await pool.query(
            "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
            [token, userId],
        );
    }

    async findRefreshToken(token) {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [token],
        );
        return result.rows[0];
    }

    async removeRefreshToken(token) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [
            token,
        ]);
    }

    async removeAllRefreshTokens(userId) {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [
            userId,
        ]);
    }

    // --- PASSWORD RESET ---
    async createPasswordReset(userId, token, expiresAt) {
        await pool.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt],
        );
    }

    async findValidPasswordReset(token, userId) {
        const result = await pool.query(
            'SELECT * FROM password_resets WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
            [token, userId],
        );
        return result.rows[0];
    }

    async deletePasswordReset(token) {
        await pool.query('DELETE FROM password_resets WHERE token = $1', [
            token,
        ]);
    }
}

module.exports = new UserRepository();
