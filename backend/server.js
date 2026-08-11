require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION, // true only when NODE_ENV=production (i.e. real HTTPS deployment)
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(function (err) {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL database.');
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/register', function (req, res) {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  const checkSql = 'SELECT id FROM users WHERE email = ?';
  db.query(checkSql, [email], function (err, results) {
    if (err) return res.status(500).json({ message: 'Server error.' });

    if (results.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    bcrypt.hash(password, 10, function (err, hashedPassword) {
      if (err) return res.status(500).json({ message: 'Error securing password.' });

      const insertSql = 'INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [full_name, email, phone || null, hashedPassword], function (err, result) {
        if (err) return res.status(500).json({ message: 'Error creating account.' });

        res.status(201).json({ message: 'Account created successfully.' });
      });
    });
  });
});

app.post('/login', loginLimiter, function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], function (err, results) {
    if (err) return res.status(500).json({ message: 'Server error.' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (err) return res.status(500).json({ message: 'Server error.' });

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      req.session.userId = user.id;
      req.session.fullName = user.full_name;

      res.json({ message: 'Login successful.', full_name: user.full_name });
    });
  });
});

app.post('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) return res.status(500).json({ message: 'Error logging out.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

app.get('/check-session', function (req, res) {
  if (req.session.userId) {
    res.json({ loggedIn: true, full_name: req.session.fullName });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(process.env.PORT, function () {
  console.log('Server running on http://localhost:' + process.env.PORT);
});