import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { getRooms } from './game/GameRoom';

// Create a custom registry
const register = new Registry();

// Default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

const socketEventsTotal = new Counter({
  name: 'socket_events_total',
  help: 'Total number of socket events processed',
  labelNames: ['event'],
  registers: [register],
});

const activeRooms = new Gauge({
  name: 'active_rooms',
  help: 'Number of active game rooms',
  registers: [register],
});

const activePlayers = new Gauge({
  name: 'active_players',
  help: 'Number of active players across all rooms',
  registers: [register],
});

const gameTickDuration = new Histogram({
  name: 'game_tick_duration_ms',
  help: 'Duration of game tick processing in milliseconds',
  buckets: [1, 2, 5, 10, 20, 50],
  registers: [register],
});

// Update room/player gauges periodically
setInterval(() => {
  const rooms = getRooms();
  activeRooms.set(rooms.length);
  let total = 0;
  for (const room of rooms) total += room.getPlayerCount();
  activePlayers.set(total);
}, 5000);

// Express middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
  });
  next();
}

export async function registerMetrics(): Promise<string> {
  return register.metrics();
}

export { socketEventsTotal, gameTickDuration };
