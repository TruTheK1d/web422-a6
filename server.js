// server.js
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const userService = require('./user-service.js');

const passport = require('passport');
const passportJWT = require('passport-jwt');
const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const jwt = require('jsonwebtoken');

const HTTP_PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Passport JWT strategy setup
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    userService
      .getUserById(jwt_payload._id)
      .then((user) => {
        if (user) return done(null, user);
        else return done(null, false);
      })
      .catch(() => done(null, false));
  })
);

app.use(passport.initialize());

// Public routes
app.post('/api/user/register', (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => res.json({ message: msg }))
    .catch((msg) => res.status(422).json({ message: msg }));
});

app.post('/api/user/login', (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      const payload = { _id: user._id, userName: user.userName };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });
      res.json({ message: { token } });
    })
    .catch((msg) => res.status(422).json({ message: msg }));
});

// Protected routes (passport JWT auth)
app.get(
  '/api/user/favourites',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.put(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.delete(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.get(
  '/api/user/history',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getHistory(req.user._id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.put(
  '/api/user/history/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .addHistory(req.user._id, req.params.id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.delete(
  '/api/user/history/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeHistory(req.user._id, req.params.id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

// Connect DB and start server
userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log(`User API listening on port ${HTTP_PORT}`)
    );
  })
  .catch((err) => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
