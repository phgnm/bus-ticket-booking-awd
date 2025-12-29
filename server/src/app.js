const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
//const xss = require('xss-clean');
const hpp = require('hpp');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const seatRoutes = require('./routes/seatRoutes');
const tripRoutes = require('./routes/tripRoutes');
const locationRoutes = require('./routes/locationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');


const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Quá nhiều request, vui lòng thử lại sau vài phút'
});

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(helmet());
app.use(hpp());
app.use(cookieParser());
app.use(express.json());

// Debug Middleware: Log all requests
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
        next();
    });
}

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// APIs
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', limiter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ GLOBAL ERROR HANDLER:', err);
    res.status(500).json({
        msg: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
