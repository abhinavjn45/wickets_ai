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
const requirementsRoutes = require('./src/routes/requirements.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/requirements', requirementsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Wickets.ai Backend Server is running on port ${PORT}\n`);
});

// Explicit Error Handling for the server
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please clear hanging processes and try again.`);
        process.exit(1);
    } else {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
});

// Catch systemic crashes to log them before exiting
process.on('uncaughtException', (error) => {
    console.error('🔥 CRITICAL: Uncaught Exception:', error);
    // Add specific logging to a file if needed
    require('fs').appendFileSync('debug.log', `\n[${new Date().toISOString()}] Uncaught Exception: ${error.stack || error}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
    require('fs').appendFileSync('debug.log', `\n[${new Date().toISOString()}] Unhandled Rejection: ${reason}`);
});
