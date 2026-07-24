const passport    = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt  = require('passport-jwt').ExtractJwt;
const { JWT_SECRET } = require('./env');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey:    JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    // Implemented in feature/api/auth:
    // Load user from DB, check blacklisted_tokens, call done(null, user)
    return done(null, false);
  }),
);

module.exports = passport;
