const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'alphascope-dev-secret-32chars-min';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function ok(data, status = 200) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(data) };
}
function fail(msg, status = 400) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error: msg }) };
}
function preflight() {
  return { statusCode: 204, headers: CORS, body: '' };
}
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
function hashPw(plain) {
  return bcrypt.hashSync(plain, 10);
}
function checkPw(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}
function getUser(event) {
  const auth  = (event.headers.authorization || event.headers.Authorization || '');
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token ? verifyToken(token) : null;
}
function body(event) {
  try { return JSON.parse(event.body || '{}'); } catch { return {}; }
}

module.exports = { ok, fail, preflight, signToken, hashPw, checkPw, getUser, body, CORS };
