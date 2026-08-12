require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
app.set('trust proxy', 1); // Trust first proxy (Vercel / load balancer)
const PORT = process.env.PORT || 3001;

const logRoutes = require('./routes/log');
const recipeRoutes = require('./routes/recipes');

const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const path = require('path');

const passport = require('./config/passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');

// Allow credentials for CORS (cookies)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // URL of frontend in dev
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session Setup
// Session Setup (PostgreSQL)
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(session({
    store: new pgSession({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'super_secret_health_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true if https
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.use('/api/log', logRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// SERVE FRONTEND (Production)
// Adjust path if needed. Assuming client build is in ../client/dist
const frontendPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // Express 5: use regex or (.*) instead of *
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// Vercel imports this module as a serverless function handler instead of
// running a persistent process, so only listen when running standalone (local/Docker).
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
