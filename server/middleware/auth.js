const requireAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        req.userId = req.user.id;
        return next();
    }
    return res.status(401).json({ message: 'Authentication required' });
};

module.exports = { requireAuth };
