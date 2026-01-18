const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id_user, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wedding routes
app.get('/api/wedding', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wedding WHERE id_user = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wedding', authenticateJWT, async (req, res) => {
  const { groom_name, bride_name, wedding_date, akad_date, reception_date, location, google_maps_link } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO wedding (id_user, groom_name, bride_name, wedding_date, akad_date, reception_date, location, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, groom_name, bride_name, wedding_date, akad_date, reception_date, location, google_maps_link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invitation routes
app.get('/api/invitation', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invitation WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invitation', authenticateJWT, async (req, res) => {
  const { id_wedding, slug, theme, cover_text, background_music, status } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO invitation (id_wedding, slug, theme, cover_text, background_music, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_wedding, slug, theme, cover_text, background_music, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invitation/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query('SELECT * FROM invitation WHERE slug = $1', [slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invitation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guest routes
app.get('/api/guest', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guest WHERE id_invitation IN (SELECT id_invitation FROM invitation WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1))', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guest', authenticateJWT, async (req, res) => {
  const { id_invitation, guest_name, phone, address, invitation_type } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO guest (id_invitation, guest_name, phone, address, invitation_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id_invitation, guest_name, phone, address, invitation_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RSVP routes
app.get('/api/rsvp', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rsvp WHERE id_guest IN (SELECT id_guest FROM guest WHERE id_invitation IN (SELECT id_invitation FROM invitation WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)))', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rsvp', async (req, res) => {
  const { id_guest, attendance, total_guest, message } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO rsvp (id_guest, attendance, total_guest, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_guest, attendance, total_guest, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery routes
app.get('/api/gallery', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gallery WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery', authenticateJWT, async (req, res) => {
  const { id_wedding, media_type, file_url, caption } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO gallery (id_wedding, media_type, file_url, caption) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_wedding, media_type, file_url, caption]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Love Story routes
app.get('/api/love-story', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM love_story WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/love-story', authenticateJWT, async (req, res) => {
  const { id_wedding, title, description, story_date } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO love_story (id_wedding, title, description, story_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_wedding, title, description, story_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gift routes
app.get('/api/gift', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gift WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gift', authenticateJWT, async (req, res) => {
  const { id_wedding, bank_name, account_name, account_number } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO gift (id_wedding, bank_name, account_name, account_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_wedding, bank_name, account_name, account_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wishes routes
app.get('/api/wishes', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wishes WHERE id_guest IN (SELECT id_guest FROM guest WHERE id_invitation IN (SELECT id_invitation FROM invitation WHERE id_wedding IN (SELECT id_wedding FROM wedding WHERE id_user = $1)))', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishes', async (req, res) => {
  const { id_guest, message } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO wishes (id_guest, message) VALUES ($1, $2) RETURNING *',
      [id_guest, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});