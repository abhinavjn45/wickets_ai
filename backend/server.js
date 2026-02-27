const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./src/routes/auth.routes');
const usersRoutes = require('./src/routes/users.routes');
const mediaRoutes = require('./src/routes/media.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/media', mediaRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n🚀 Wickets.ai Backend Server is running on port ${PORT}\n`));
