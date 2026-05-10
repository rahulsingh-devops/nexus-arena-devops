import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { GameRoom, getRooms, getRoom, createRoom } from '../game/GameRoom';

export const roomsRouter = Router();

// List all rooms
roomsRouter.get('/', authMiddleware, (_req: Request, res: Response) => {
  const rooms = getRooms();
  const roomList = rooms.map((room: GameRoom) => ({
    id: room.id,
    name: room.name,
    players: room.getPlayerCount(),
    maxPlayers: room.maxPlayers,
    status: room.status,
  }));
  res.json({ rooms: roomList });
});

// Create a room
roomsRouter.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 30) {
      res.status(400).json({ error: 'Room name is required (max 30 chars)' });
      return;
    }

    const room = createRoom(name.trim());
    res.status(201).json({
      room: {
        id: room.id,
        name: room.name,
        players: 0,
        maxPlayers: room.maxPlayers,
        status: room.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create room';
    res.status(400).json({ error: message });
  }
});

// Get specific room info
roomsRouter.get('/:roomId', authMiddleware, (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    room: {
      id: room.id,
      name: room.name,
      players: room.getPlayerCount(),
      maxPlayers: room.maxPlayers,
      status: room.status,
    },
  });
});
