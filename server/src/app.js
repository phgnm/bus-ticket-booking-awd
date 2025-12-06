const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cookieParser = require('cookie-parser');
const tripRoutes = require('./routes/tripRoutes');
const locationRoutes = require('./routes/locationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(cookieParser());
app.use(express.json());

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api', adminRoutes);

module.exports = app;
