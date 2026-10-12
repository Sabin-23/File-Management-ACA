import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';


const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL));


export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  try {
    const { payload } = await jwtVerify(token, jwks);

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token: no subject.' });
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}