const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const transporter = require('../config/mail');
const userRepository = require('../repositories/userRepository');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    // generate tokens
    _generateTokens(user) {
        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '60m' },
        );
        const refreshToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' },
        );
        return { accessToken, refreshToken };
    }

    async register({ email, password, full_name }) {
        // check if user exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) throw new Error('Email đã được sử dụng');

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // create verification token and user
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = await userRepository.create({
            email,
            passwordHash: hash,
            fullName: full_name,
            role: 'user',
            verificationToken,
            isVerified: false,
        });

        // send email
        const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Xác thực tài khoản - Bus Ticket Booking',
            html: `<h3>Chào mừng ${full_name}!</h3><p>Click để kích hoạt:</p><a href="${verifyUrl}">Kích hoạt</a>`,
        });

        return newUser;
    }

    async login({ email, password }) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error('Invalid Credentials');

        if (!user.is_verified && !user.google_id) {
            throw new Error(
                'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.',
            );
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error('Invalid Credentials');

        const tokens = this._generateTokens(user);
        await userRepository.addRefreshToken(tokens.refreshToken, user.id);

        return { ...tokens, user };
    }

    async verifyEmail(token) {
        const user = await userRepository.findByVerificationToken(token);
        if (!user)
            throw new Error('Token không hợp lệ hoặc tài khoản đã kích hoạt');

        await userRepository.verifyUser(user.id);
        return true;
    }

    async googleLogin(idToken) {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, sub } = ticket.getPayload();

        let user = await userRepository.findByEmailOrGoogleId(email, sub);
        if (!user) {
            user = await userRepository.createGoogleUser(email, name, sub);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '1h' },
        );
        return { token, user };
    }

    async refreshToken(oldRefreshToken) {
        const payload = jwt.verify(
            oldRefreshToken,
            process.env.JWT_REFRESH_SECRET,
        );
        const tokenInDb =
            await userRepository.findRefreshToken(oldRefreshToken);
        if (!tokenInDb) throw new Error('Token invalid or revoked');

        const newAccessToken = jwt.sign(
            { id: payload.id, role: payload.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '60m' },
        );
        return newAccessToken;
    }

    async logout(refreshToken) {
        if (refreshToken) await userRepository.removeRefreshToken(refreshToken);
    }

    async forgotPassword(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) return;

        const resetToken = jwt.sign(
            { id: user.id, purpose: 'reset-password' },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' },
        );
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await userRepository.createPasswordReset(
            user.id,
            resetToken,
            expiresAt,
        );

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu',
            html: `<p>Click để đặt lại mật khẩu:</p><a href="${resetUrl}">${resetUrl}</a>`,
        });
    }

    async resetPassword(token, newPassword) {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const resetRecord = await userRepository.findValidPasswordReset(
            token,
            decoded.id,
        );

        if (!resetRecord) throw new Error('Token không hợp lệ hoặc đã sử dụng');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await userRepository.updatePassword(decoded.id, passwordHash);
        await userRepository.deletePasswordReset(token);
        await userRepository.removeAllRefreshTokens(decoded.id); // Logout all devices
    }
}

module.exports = new AuthService();
