const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/vendors', vendorRoutes);

// Basic health check
app.get('/', (req, res) => res.send('Backend running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});