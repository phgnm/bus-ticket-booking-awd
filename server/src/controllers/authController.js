const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        await authService.register(req.body);
        res.status(201).json({
            msg: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
        });
    } catch (err) {
        if (err.message === 'Email đã được sử dụng') {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        console.log('[AuthController] Login attempt for:', req.body.email);
        const { accessToken, refreshToken, user } = await authService.login(
            req.body,
        );

        // send refresh token via cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ token: accessToken, user });
    } catch (err) {
        if (
            err.message === 'Invalid Credentials' ||
            err.message.includes('chưa được kích hoạt')
        ) {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        await authService.logout(refreshToken);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        res.json({ msg: 'Logged out' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token, user } = await authService.googleLogin(req.body.idToken);
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(401).json({ msg: 'Invalid Google token' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ msg: 'Token không hợp lệ' });

        await authService.verifyEmail(token);
        res.json({ msg: 'Kích hoạt tài khoản thành công!' });
    } catch (err) {
        return res.status(400).json({ msg: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(401).json({ msg: 'Unauthenticated' });

        const token = await authService.refreshToken(refreshToken);
        res.json({ token });
    } catch (err) {
        res.status(403).json({ msg: `Token expired or invalid: ${err}` });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        await authService.forgotPassword(req.body.email);
        // always return 200 no matter the account exists or not
        res.json({
            msg: 'Link reset đã được gửi đến email, vui lòng kiểm tra',
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ msg: 'Thiếu thông tin' });

        await authService.resetPassword(token, newPassword);
        res.json({
            msg: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại',
        });
    } catch (err) {
        if (err.message.includes('Token') || err.message.includes('jwt')) {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).send('Server error');
    }
};
