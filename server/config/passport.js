const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Serialize user for session (store only ID)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session (fetch full object from ID)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const avatar = profile.photos ? profile.photos[0].value : null;

                // 1. Try to find user by Google ID
                let user = await prisma.user.findUnique({ where: { googleId } });

                // 2. If not found, try to find by Email (and link account)
                if (!user) {
                    user = await prisma.user.findUnique({ where: { email } });

                    if (user) {
                        // Update existing user with Google ID
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { googleId, avatar }
                        });
                    } else {
                        // SPECIAL MIGRATION FOR FIRST USER
                        // If User ID 1 exists (the usage during dev) and has a generic email, we claim it.
                        const legacyUser = await prisma.user.findUnique({ where: { id: 1 } });
                        if (legacyUser && (legacyUser.email === 'user@example.com' || legacyUser.email === 'default@example.com') && !legacyUser.googleId) {
                            console.log("MIGRATION: Linking legacy User 1 to new Google Account");
                            user = await prisma.user.update({
                                where: { id: 1 },
                                data: {
                                    email, // Update to real Google email
                                    googleId,
                                    name: profile.displayName,
                                    avatar
                                }
                            });
                        } else {
                            // 3. Create new user
                            user = await prisma.user.create({
                                data: {
                                    email,
                                    googleId,
                                    name: profile.displayName,
                                    avatar
                                }
                            });
                        }
                    }
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }));
} else {
    console.warn("⚠️ Google Auth credentials missing. Auth will not work.");
}

module.exports = passport;
