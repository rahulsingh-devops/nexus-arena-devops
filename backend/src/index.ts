import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from './routes/auth';
import { roomsRouter } from './routes/rooms';
import { healthRouter } from './routes/health';
import { rateLimiter } from './middleware/rateLimiter';
import { socketAuthMiddleware } from './socket/middleware';
import { registerSocketHandlers } from './socket/handlers';
import { initDatabase } from './services/database';
import { initRedis } from './services/redis';
import { registerMetrics, metricsMiddleware } from './metrics';

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function main(): Promise<void> {
  console.log(`[Server] Starting Nexus Arena backend (${NODE_ENV})...`);

  // Initialize services
  await initDatabase();
  await initRedis();

  // Express setup
  const app = express();
  const server = http.createServer(app);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  // Rate limiter (skip in test)
  if (NODE_ENV !== 'test') {
    app.use('/api/', rateLimiter);
  }

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/health', healthRouter);

  // Metrics endpoint
  app.get('/metrics', async (_req, res) => {
    try {
      const metrics = await registerMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch {
      res.status(500).send('Error collecting metrics');
    }
  });

  // Socket.IO setup
  const io = new SocketIOServer(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Socket.IO auth middleware
  io.use(socketAuthMiddleware);

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (user: ${socket.data.userId})`);
    registerSocketHandlers(io, socket);
  });

  // Start server
  server.listen(PORT, () => {
    console.log(`[Server] Nexus Arena backend listening on port ${PORT}`);
    console.log(`[Server] Environment: ${NODE_ENV}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
