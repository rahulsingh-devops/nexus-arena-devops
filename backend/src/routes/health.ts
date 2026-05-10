import { Router, Request, Response } from 'express';
import { getRooms } from '../game/GameRoom';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const rooms = getRooms();
  let totalPlayers = 0;
  for (const room of rooms) {
    totalPlayers += room.getPlayerCount();
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    rooms: rooms.length,
    players: totalPlayers,
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});
