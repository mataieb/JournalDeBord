const express = require('express');
const passport = require('passport');
const router = express.Router();

// 1. Redirect to Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Google Callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        // Redirect to frontend (development localhost or production URL)
        // We can pass a query param or cookie to indicate success if needed, 
        // but session cookie 'connect.sid' is usually enough.

        // In dev: redirect to localhost:5173
        // In prod: redirect to /

        const clientUrl = process.env.CLIENT_URL || '/';
        res.redirect(clientUrl);
    }
);

// 3. Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        // Clear cookie if desired (express-session usually handles it via logout())
        res.redirect('/');
    });
});

// 4. Get Current User (to check session on frontend load)
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
