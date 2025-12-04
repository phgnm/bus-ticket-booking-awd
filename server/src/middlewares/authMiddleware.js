const jwt = require('jsonwebtoken');

exports.authenticateJWT = (req, res, next) => {
    // Take the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
            .status(401)
            .json({ msg: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Attach user information to the request object
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ msg: `Invalid token, ${err.message}` });
    }
};

exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ msg: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

exports.optionalAuthenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user; 
            }
            next();
        });
    } else {
        next();
    }
};