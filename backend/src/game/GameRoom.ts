import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { GameState, GameEvent } from './GameState';
import { MAX_POWERUPS, POWERUP_SPAWN_INTERVAL } from './physics';

const TICK_RATE = 20; // 20 ticks per second
const TICK_INTERVAL = 1000 / TICK_RATE;

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export class GameRoom {
  id: string;
  name: string;
  maxPlayers = 10;
  status: RoomStatus = 'waiting';
  private gameState: GameState;
  private gameLoopTimer: NodeJS.Timeout | null = null;
  private powerUpTimer: NodeJS.Timeout | null = null;
  private lastTickTime = 0;
  private io: Server | null = null;

  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
    this.gameState = new GameState();
  }

  getPlayerCount(): number {
    return this.gameState.players.size;
  }

  addPlayer(userId: string, username: string, socketId: string): boolean {
    if (this.gameState.players.size >= this.maxPlayers) return false;
    if (this.gameState.players.has(userId)) return true; // Already in room

    this.gameState.addPlayer(userId, username, socketId);

    if (this.gameState.players.size > 0) {
      this.status = 'playing';
    }
    return true;
  }

  removePlayer(userId: string): void {
    this.gameState.removePlayer(userId);

    if (this.gameState.players.size === 0) {
      this.stopGameLoop();
      this.status = 'waiting';
    }
  }

  handlePlayerInput(userId: string, input: { seq: number; dx: number; dy: number }): void {
    this.gameState.applyInput(userId, input, TICK_INTERVAL / 1000);
  }

  handlePlayerRotation(userId: string, angle: number): void {
    this.gameState.applyRotation(userId, angle);
  }

  handlePlayerShoot(userId: string, angle: number): void {
    this.gameState.shoot(userId, angle);
  }

  ensureGameLoop(io: Server): void {
    this.io = io;
    if (this.gameLoopTimer) return;

    this.lastTickTime = Date.now();
    this.gameLoopTimer = setInterval(() => this.tick(), TICK_INTERVAL);

    // Spawn power-ups periodically
    this.powerUpTimer = setInterval(() => {
      if (this.gameState.powerUps.size < MAX_POWERUPS) {
        this.gameState.spawnPowerUp();
      }
    }, POWERUP_SPAWN_INTERVAL);

    // Spawn initial power-ups
    for (let i = 0; i < 3; i++) {
      this.gameState.spawnPowerUp();
    }

    console.log(`[GameRoom] Game loop started for room "${this.name}" (${this.id.slice(0, 8)})`);
  }

  private stopGameLoop(): void {
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    if (this.powerUpTimer) {
      clearInterval(this.powerUpTimer);
      this.powerUpTimer = null;
    }
    console.log(`[GameRoom] Game loop stopped for room "${this.name}"`);
  }

  private tick(): void {
    if (!this.io) return;

    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // Update game state
    const events = this.gameState.update(dt);

    // Broadcast events
    for (const event of events) {
      this.broadcastEvent(event);
    }

    // Broadcast state snapshot
    const snapshot = this.gameState.getSnapshot();
    this.io.to(this.id).emit('game:state', snapshot);
  }

  private broadcastEvent(event: GameEvent): void {
    if (!this.io) return;
    switch (event.type) {
      case 'playerHit':
        this.io.to(this.id).emit('game:playerHit', event.data);
        break;
      case 'playerKill':
        this.io.to(this.id).emit('game:playerKill', event.data);
        // Also send kill notification in chat
        this.io.to(this.id).emit('chat:system', {
          id: `kill-${Date.now()}`,
          userId: 'system',
          username: 'System',
          text: `☠ ${this.getPlayerName(event.data.killerId as string)} eliminated ${this.getPlayerName(event.data.victimId as string)}`,
          timestamp: Date.now(),
          type: 'kill',
        });
        break;
      case 'powerUpCollected':
        this.io.to(this.id).emit('game:powerUpCollected', event.data);
        break;
    }
  }

  private getPlayerName(playerId: string): string {
    return this.gameState.players.get(playerId)?.username || 'Unknown';
  }
}

// ---- Room Registry ----
const rooms: Map<string, GameRoom> = new Map();

export function createRoom(name: string): GameRoom {
  const room = new GameRoom(name);
  rooms.set(room.id, room);
  return room;
}

export function getRoom(id: string): GameRoom | undefined {
  return rooms.get(id);
}

export function getRooms(): GameRoom[] {
  return Array.from(rooms.values());
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}
