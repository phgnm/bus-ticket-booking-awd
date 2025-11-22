const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hash, full_name]
        );

        // Generate Token
        const token = jwt.sign({
            id: newUser.rows[0].id,
            role: newUser.rows[0].role
        },
            process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h'
        });

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
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return Token
        const token = jwt.sign({
            id: user.rows[0].id,
            role: user.rows[0].role
        },
            process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h'
        });

        // Exclude password_hash from user object
        delete user.rows[0].password_hash;
        res.json({ token, user: user.rows[0] });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};