const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { put } = require('@vercel/blob');

// Files are buffered in memory then pushed to Vercel Blob (no persistent local disk on Vercel).
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // Vercel serverless functions cap request bodies around 4.5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mintype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mintype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports following filetypes - " + filetypes));
    }
});

// POST endpoint
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `uploads/${uniqueSuffix}${path.extname(req.file.originalname)}`;

        const blob = await put(filename, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype,
        });

        res.json({ url: blob.url });
    } catch (e) {
        res.status(500).json({ message: 'Upload failed', error: e.message });
    }
});

module.exports = router;
