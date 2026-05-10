import { Server, Socket } from 'socket.io';
import { getRoom, getRooms } from '../game/GameRoom';
import validator from 'validator';

// Simple server-side text sanitization
function sanitizeText(text: string): string {
  return validator.escape(validator.stripLow(text.substring(0, 200)));
}

// Track which room each socket is in
const socketRooms: Map<string, string> = new Map();

export function registerSocketHandlers(io: Server, socket: Socket): void {
  const userId: string = socket.data.userId;
  const username: string = socket.data.username;

  // ---- Room Management ----
  socket.on('room:join', (data: { roomId: string }) => {
    const { roomId } = data;
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Leave previous room if any
    const prevRoomId = socketRooms.get(socket.id);
    if (prevRoomId && prevRoomId !== roomId) {
      const prevRoom = getRoom(prevRoomId);
      prevRoom?.removePlayer(userId);
      socket.leave(prevRoomId);
      broadcastRoomUpdate(io);
    }

    // Join new room
    const joined = room.addPlayer(userId, username, socket.id);
    if (!joined) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    socket.join(roomId);
    socketRooms.set(socket.id, roomId);

    // Notify room
    io.to(roomId).emit('chat:system', {
      id: `sys-${Date.now()}`,
      userId: 'system',
      username: 'System',
      text: `${username} joined the arena`,
      timestamp: Date.now(),
      type: 'system',
    });

    // Start game loop if needed
    room.ensureGameLoop(io);
    broadcastRoomUpdate(io);
  });

  socket.on('room:leave', (data: { roomId: string }) => {
    leaveRoom(io, socket, data.roomId, userId, username);
  });

  // ---- Player Input ----
  socket.on('player:input', (data: { seq: number; dx: number; dy: number }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;
    const room = getRoom(roomId);
    room?.handlePlayerInput(userId, data);
  });

  socket.on('player:rotate', (data: { angle: number }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;
    const room = getRoom(roomId);
    room?.handlePlayerRotation(userId, data.angle);
  });

  socket.on('player:shoot', (data: { angle: number }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;
    const room = getRoom(roomId);
    room?.handlePlayerShoot(userId, data.angle);
  });

  // ---- Chat ----
  socket.on('chat:send', (data: { text: string }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const sanitized = sanitizeText(data.text);
    if (!sanitized.trim()) return;

    io.to(roomId).emit('chat:message', {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      username,
      text: sanitized,
      timestamp: Date.now(),
      type: 'chat',
    });
  });

  // ---- Disconnect ----
  socket.on('disconnect', (reason: string) => {
    console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      leaveRoom(io, socket, roomId, userId, username);
    }
    socketRooms.delete(socket.id);
  });
}

function leaveRoom(io: Server, socket: Socket, roomId: string, userId: string, username: string): void {
  const room = getRoom(roomId);
  if (room) {
    room.removePlayer(userId);
    socket.leave(roomId);
    socketRooms.delete(socket.id);

    io.to(roomId).emit('chat:system', {
      id: `sys-${Date.now()}`,
      userId: 'system',
      username: 'System',
      text: `${username} left the arena`,
      timestamp: Date.now(),
      type: 'system',
    });

    broadcastRoomUpdate(io);
  }
}

function broadcastRoomUpdate(io: Server): void {
  const rooms = getRooms().map((r) => ({
    id: r.id,
    name: r.name,
    players: r.getPlayerCount(),
    maxPlayers: r.maxPlayers,
    status: r.status,
  }));
  io.emit('rooms:update', rooms);
}
