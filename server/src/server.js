const http = require('http');
const app = require('./app');
const pool = require('./config/db');
const initCronJobs = require('./cron/cronJob');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173', // Allow frontend
        methods: ['GET', 'POST'],
        credentials: true
    },
});

// Pass io to app for use in controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const createDefaultAdmin = async () => {
    const checkAdmin = await pool.query(
        "SELECT * FROM users WHERE role = 'admin' LIMIT 1",
    );

    if (checkAdmin.rows.length === 0) {
        const email = 'admin@vexere.com';
        const password = 'admin123';
        const fullName = 'System Administrator';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            "INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES ($1, $2, $3, 'admin', TRUE)",
            [email, passwordHash, fullName],
        );
    }
};

server.listen(PORT, async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connected successfully');
        
        initCronJobs(io);
        console.log(`Server is running on port ${PORT}`);
        console.log(`API Endpoint: http://localhost:${PORT}`);

        if (process.env.CI !== 'true') {
            await createDefaultAdmin();
        }
    }
    catch (err) {
        console.error('❌ Database connection failed:', err);
    }
});
