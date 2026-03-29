const fs   = require('fs');
const path = require('path');

// On Netlify: /tmp resets between invocations — not suitable for users.
// Strategy: seed from USERS_SEED env var on cold start, write to /tmp for the session.
// For real persistence, set USERS_SEED to your JSON in Netlify env vars and update it
// whenever a new user registers (or use Netlify Blobs / a DB).

const IS_NETLIFY = !!process.env.NETLIFY;
const DB_PATH = IS_NETLIFY
  ? '/tmp/as_users.json'
  : path.join(__dirname, '../../data/users.json');

let _seeded = false;

function ensureSeeded() {
  if (_seeded) return;
  _seeded = true;
  if (!IS_NETLIFY) return;
  try { fs.readFileSync(DB_PATH); return; } catch {}
  // Seed from env var or start empty
  const seed = process.env.USERS_SEED || '{"users":[]}';
  try { fs.writeFileSync(DB_PATH, seed); } catch (e) { console.error('seed error', e.message); }
}

function readDB() {
  ensureSeeded();
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [] }; }
}

function writeDB(db) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db));
    return true;
  } catch (e) { console.error('writeDB', e.message); return false; }
}

function findUser(username) {
  const db = readDB();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function findById(id) {
  return readDB().users.find(u => u.id === id) || null;
}

function createUser(username, email, hashedPw) {
  const db = readDB();
  if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return { error: 'Username already taken' };
  if (email && db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()))
    return { error: 'Email already registered' };
  const user = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    username, email,
    password: hashedPw,
    bookmarks: [],
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  return { user };
}

function getBookmarks(userId) {
  const u = findById(userId);
  return u ? (u.bookmarks || []) : [];
}

function addBookmark(userId, stock) {
  const db = readDB();
  const u  = db.users.find(u => u.id === userId);
  if (!u) return { error: 'User not found' };
  if (!u.bookmarks) u.bookmarks = [];
  if (u.bookmarks.find(b => b.symbol === stock.symbol)) return { error: 'Already bookmarked' };
  u.bookmarks.push({ ...stock, bookmarked_at: new Date().toISOString() });
  writeDB(db);
  return { ok: true };
}

function removeBookmark(userId, symbol) {
  const db = readDB();
  const u  = db.users.find(u => u.id === userId);
  if (!u) return { error: 'User not found' };
  u.bookmarks = (u.bookmarks || []).filter(b => b.symbol !== symbol);
  writeDB(db);
  return { ok: true };
}

function safeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = { findUser, findById, createUser, getBookmarks, addBookmark, removeBookmark, safeUser };
