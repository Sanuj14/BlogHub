require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
// Larger limit so client-compressed images (base64 data URLs) fit in the body.
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// Serve the static frontend (used locally; on Vercel the CDN serves /public).
app.use(express.static(path.join(__dirname, 'public')));

// Make sure the database is connected before any API request is handled.
// This is what keeps the app working in a serverless (Vercel) environment.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Check MONGODB_URI.' });
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

// Unknown API route -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

// Anything else that isn't a static file -> the 404 page (locally).
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

// Only start a listener when run directly (`node app.js`).
// On Vercel the app is imported by api/index.js and must NOT call listen().
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB().catch((e) => console.error(e.message));
  app.listen(PORT, () => console.log(`🚀 BlogHub running at http://localhost:${PORT}`));
}

module.exports = app;
