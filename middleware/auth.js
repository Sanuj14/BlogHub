const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'bloghub_jwt_secret_change_me';
const EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days, in seconds

/* --------------------------------------------------------------------------
 * Minimal, dependency-free JWT (HS256) built on Node's crypto module.
 * We roll our own because the `jsonwebtoken` package pulls in an ancient
 * transitive dependency that crashes on modern Node (SlowBuffer was removed).
 * ------------------------------------------------------------------------ */

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload, secret = JWT_SECRET, expiresInSec = EXPIRES_IN) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verify(token, secret = JWT_SECRET) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');

  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}

/* ---------------------------------- middleware --------------------------- */

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : header;
}

/** Require a valid JWT. Sets req.user = { id, name, username, email, role }. */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }
  try {
    req.user = verify(token);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}

/** Attach req.user when a valid token is present, but never block the request. */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try { req.user = verify(token); } catch (_) { /* ignore */ }
  }
  next();
}

function signToken(user) {
  return sign({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  });
}

module.exports = { requireAuth, optionalAuth, signToken, JWT_SECRET };
