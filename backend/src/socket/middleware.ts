import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../services/auth';

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const payload = verifyToken(token);
    socket.data.userId = payload.id;
    socket.data.username = payload.username;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
