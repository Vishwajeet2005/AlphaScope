const { ok, fail, preflight, getUser, body } = require('./utils');
const { getBookmarks, addBookmark, removeBookmark } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const user = getUser(event);
  if (!user) return fail('Unauthorized', 401);

  // Extract symbol from path: /.netlify/functions/bookmarks/SYMBOL
  const after = (event.path || '')
    .replace(/.*\/bookmarks/, '')
    .replace(/^\//, '')
    .trim();
  const symbol = after ? decodeURIComponent(after) : null;

  if (event.httpMethod === 'GET' && !symbol) {
    return ok(getBookmarks(user.id));
  }

  if (event.httpMethod === 'POST' && !symbol) {
    const b = body(event);
    if (!b.symbol) return fail('symbol required');
    const r = addBookmark(user.id, {
      symbol: b.symbol,
      name:   b.name   || b.symbol,
      sector: b.sector || '',
      price:  Number(b.price) || 0,
    });
    if (r.error) return fail(r.error);
    return ok({ ok: true, bookmarks: getBookmarks(user.id) });
  }

  if (event.httpMethod === 'DELETE' && symbol) {
    removeBookmark(user.id, symbol);
    return ok({ ok: true, bookmarks: getBookmarks(user.id) });
  }

  return fail('Not found', 404);
};
