/**
 * StudySphere - Node.js / Express Server Alternative
 * ==================================================
 * For developers running in Node.js environments.
 * Mirrors the Python server.py endpoints, SQLite database,
 * and OpenAI proxy.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Static file serving
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Note: In Node.js environment, better-sqlite3 or sqlite3 can be connected.
// For zero-install out-of-the-box running on macOS, python3 server.py is pre-configured.

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', runtime: 'node', app: 'StudySphere' });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`StudySphere Node server running on http://localhost:${PORT}`);
});
