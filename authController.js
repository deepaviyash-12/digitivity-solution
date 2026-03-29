const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// ─── Register ─────────────────────────────────────────────────────────────────

const register = (req, res, next) => {
  try {
    const { username, password } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already taken.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)'
    ).run(id, username, hashedPassword);

    const token = generateToken({ id, username });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { token, user: { id, username } },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: { token, user: { id: user.id, username: user.username } },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Me ───────────────────────────────────────────────────────────────────────

const me = (req, res) => {
  const user = db
    .prepare('SELECT id, username, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({ success: true, data: { user } });
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { register, login, me };
