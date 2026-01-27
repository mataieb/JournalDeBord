const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

const logRoutes = require('./routes/log');
const recipeRoutes = require('./routes/recipes');

const uploadRoutes = require('./routes/upload');
const path = require('path');

app.use(cors());
app.use(express.json());

// Determine storage root similar to upload route
const STORAGE_ROOT = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.STORAGE_ROOT || path.join(__dirname, 'uploads/..');
const uploadDir = path.join(STORAGE_ROOT, 'uploads');

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(uploadDir));

app.use('/api/log', logRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/upload', uploadRoutes);

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
