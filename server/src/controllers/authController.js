const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: '60m'
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: '7d'
        }
    );

    return { accessToken, refreshToken };
}

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
            [refreshToken, user.rows[0].id]
        );

        // Send refresh token via cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
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
        await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    }

    res.clearCookie('refreshToken');
    res.json({
        msg: "Logged out"
    });
}

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
            msg: "Unauthenticated"
        });

    try {
        // Verify token
        const payload = jwt.verify(this.refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Check if valid
        const tokenInDb = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
        if (tokenInDb.rows.length === 0)
            return res.status(403).json({
                msg: "Token invalid or revoked"
            });
        
        // Create new access token
        const newAccessToken = jwt.sign(
            { id: payload.id, role: payload.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '60m' }
        );

        res.json({ token: newAccessToken });
    }
    catch (err) {
        console.error(err);
        res.status(403).json({ msg: "Token expired or invalid" });
    }
}
