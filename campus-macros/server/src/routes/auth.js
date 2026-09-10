import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8) return res.status(400).json({ error: 'Email and a password of 8+ characters required' });
    const e = email.toLowerCase();
    if (await db.get('SELECT id FROM users WHERE email=?', [e])) return res.status(409).json({ error: 'An account with that email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const { lastInsertRowid } = await db.run('INSERT INTO users(email,password_hash) VALUES(?,?)', [e, hash]);
    const user = { id: lastInsertRowid, email: e };
    res.json({ token: signToken(user), user, needsProfile: true });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await db.get('SELECT * FROM users WHERE email=?', [(email || '').toLowerCase()]);
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
    const hasProfile = !!(await db.get('SELECT 1 FROM profiles WHERE user_id=?', [user.id]));
    res.json({ token: signToken(user), user: { id: user.id, email: user.email }, needsProfile: !hasProfile });
  } catch (err) { next(err); }
});
