import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-arena-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

export interface UserPayload {
  id: string;
  username: string;
}

// In-memory user store fallback (when PostgreSQL is unavailable)
const memoryUsers: Map<string, { id: string; username: string; passwordHash: string }> = new Map();

export async function registerUser(username: string, password: string): Promise<{ id: string; username: string; token: string }> {
  // Validate
  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    // Try PostgreSQL first
    const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      throw new Error('Username already taken');
    }

    const result = await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, username: user.username });
    return { id: user.id, username: user.username, token };
  } catch (err) {
    // If DB error (not a validation error), fall back to in-memory
    if ((err as Error).message === 'Username already taken') throw err;
    if ((err as Error).message.includes('must be')) throw err;

    // In-memory fallback
    if (memoryUsers.has(username)) {
      throw new Error('Username already taken');
    }

    const id = uuidv4();
    memoryUsers.set(username, { id, username, passwordHash });
    const token = generateToken({ id, username });
    return { id, username, token };
  }
}

export async function loginUser(username: string, password: string): Promise<{ id: string; username: string; token: string }> {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    // Try PostgreSQL
    const result = await query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid username or password');
    }

    const token = generateToken({ id: user.id, username: user.username });
    return { id: user.id, username: user.username, token };
  } catch (err) {
    if ((err as Error).message === 'Invalid username or password') throw err;

    // In-memory fallback
    const memUser = memoryUsers.get(username);
    if (!memUser) {
      throw new Error('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, memUser.passwordHash);
    if (!valid) {
      throw new Error('Invalid username or password');
    }

    const token = generateToken({ id: memUser.id, username: memUser.username });
    return { id: memUser.id, username: memUser.username, token };
  }
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): UserPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
