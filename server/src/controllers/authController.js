const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: '60m',
        },
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: '7d',
        },
    );

    return { accessToken, refreshToken };
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.register = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hash, full_name],
        );

        // Generate Token
        const token = jwt.sign(
            {
                id: newUser.rows[0].id,
                role: newUser.rows[0].role,
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: '1h',
            },
        );

        res.status(201).json({ token, user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [
            email,
        ]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(
            password,
            user.rows[0].password_hash,
        );
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user.rows[0]);

        // Save refresh token into DB
        await pool.query(
            "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
            [refreshToken, user.rows[0].id],
        );

        // Send refresh token via cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Return accessToken
        res.json({ token: accessToken, user: { ...user.rows[0] } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [
            refreshToken,
        ]);
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    res.json({
        msg: 'Logged out',
    });
};

exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload;

        // Find user in DB
        let user = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR google_id = $2',
            [email, sub],
        );

        if (user.rows.length === 0) {
            // If user doesn't exist, create a new one
            user = await pool.query(
                'INSERT INTO users (email, full_name, google_id) VALUES ($1, $2, $3) RETURNING id, email, role',
                [email, name, sub],
            );
        }

        // Generate Token
        const token = jwt.sign(
            {
                id: user.rows[0].id,
                role: user.rows[0].role,
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: '1h',
            },
        );

        res.json({ token, user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Invalid Google token' });
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(401).json({
            msg: 'Unauthenticated',
        });

    try {
        // Verify token
        const payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET,
        );

        // Check if valid
        const tokenInDb = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [refreshToken],
        );
        if (tokenInDb.rows.length === 0)
            return res.status(403).json({
                msg: 'Token invalid or revoked',
            });

        // Create new access token
        const newAccessToken = jwt.sign(
            { id: payload.id, role: payload.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '60m' },
        );

        res.json({ token: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(403).json({ msg: 'Token expired or invalid' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const normalizedEmail = email.trim().toLowerCase();
        console.log(`Email received: ${normalizedEmail}`);

        // check if user exists
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [
            normalizedEmail,
        ]);

        console.log(`users: ${user}`);

        if (user.rows.length === 0) {
            return res.status(200).json({
                // still say email has been sent to prevent illegal attack
                msg: 'Link reset đã được gửi đến email, vui lòng kiểm tra',
            });
        }

        const targetUser = user.rows[0];

        // create jwt
        const resetToken = jwt.sign(
            {
                id: targetUser.id,
                purpose: 'reset-password',
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: '15m',
            },
        );

        // save token to db to control
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [targetUser.id, resetToken, expiresAt],
        );

        // send email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu - Bus Ticket Booking',
            html: `
                <h3>Yêu cầu đặt lại mật khẩu</h3>
                <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
                <p>Vui lòng click vào link bên dưới để đặt mật khẩu mới (Link hết hạn sau 15 phút):</p>
                <a href="${resetUrl}" target="_blank">${resetUrl}</a>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.json({
            msg: 'Link reset đã được gửi đến email, vui lòng kiểm tra',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                msg: 'Thiếu thông tin cần thiết',
            });
        }

        // verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (err) {
            return res.status(400).json({
                msg: 'Token không hợp lệ hoặc đã hết hạn',
            });
        }
        // check token in DB
        const resetRecord = await pool.query(
            'SELECT * FROM password_resets WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
            [token, decoded.id],
        );
        if (resetRecord.rows.length === 0) {
            return res.status(400).json({
                msg: 'Token không hợp lệ hoặc đã được sử dụng',
            });
        }
        // new password hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        // update user password
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
            passwordHash,
            decoded.id,
        ]);
        // delete token
        await pool.query('DELETE FROM password_resets WHERE token = $1', [
            token,
        ]);
        // delete from other device for security reason
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [
            decoded.id,
        ]);
        res.json({
            msg: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
