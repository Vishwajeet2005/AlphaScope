const { ok, fail, preflight, signToken, hashPw, checkPw, body } = require('./utils');
const { findUser, createUser, safeUser } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const sub = (event.path || '')
    .replace(/.*\/auth/, '')
    .replace(/^\//, '');

  // POST /auth/register
  if (event.httpMethod === 'POST' && sub === 'register') {
    const { username, email, password } = body(event);
    if (!username || !email || !password) return fail('All fields required');
    if (username.length < 3)  return fail('Username must be at least 3 characters');
    if (password.length < 6)  return fail('Password must be at least 6 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid email');
    const result = createUser(username.trim(), email.trim().toLowerCase(), hashPw(password));
    if (result.error) return fail(result.error);
    const token = signToken({ id: result.user.id, username: result.user.username });
    return ok({ token, user: safeUser(result.user) }, 201);
  }

  // POST /auth/login
  if (event.httpMethod === 'POST' && sub === 'login') {
    const { username, password } = body(event);
    if (!username || !password) return fail('Username and password required');
    const user = findUser(username.trim());
    if (!user || !checkPw(password, user.password)) return fail('Invalid username or password', 401);
    const token = signToken({ id: user.id, username: user.username });
    return ok({ token, user: safeUser(user) });
  }

  return fail('Not found', 404);
};
