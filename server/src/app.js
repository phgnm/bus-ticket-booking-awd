const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cookieParser = require('cookie-parser');


const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);

module.exports = app;
