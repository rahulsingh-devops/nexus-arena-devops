import { v4 as uuidv4 } from 'uuid';
import {
  ARENA_WIDTH, ARENA_HEIGHT, PLAYER_SPEED, PLAYER_RADIUS, PLAYER_MAX_HEALTH,
  PROJECTILE_SPEED, PROJECTILE_RADIUS, PROJECTILE_DAMAGE, PROJECTILE_LIFETIME,
  SHOOT_COOLDOWN, POWERUP_RADIUS, POWERUP_EFFECTS,
  circleCollision, clampToArena, randomArenaPosition, Vec2,
  RESPAWN_TIME,
} from './physics';

// ---- Types ----
export interface PlayerData {
  id: string;
  username: string;
  socketId: string;
  x: number;
  y: number;
  rotation: number;
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  alive: boolean;
  lastShot: number;
  speedMultiplier: number;
  damageMultiplier: number;
  effectTimers: Map<string, NodeJS.Timeout>;
  respawnTimer: NodeJS.Timeout | null;
}

export interface ProjectileData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
  createdAt: number;
  damage: number;
}

export interface PowerUpData {
  id: string;
  x: number;
  y: number;
  type: 'health' | 'speed' | 'damage' | 'shield';
}

export interface GameStateSnapshot {
  players: Record<string, {
    id: string; username: string; x: number; y: number; rotation: number;
    health: number; maxHealth: number; kills: number; deaths: number; alive: boolean;
  }>;
  projectiles: Array<{ id: string; x: number; y: number; vx: number; vy: number; ownerId: string }>;
  powerUps: Array<{ id: string; x: number; y: number; type: string }>;
  tick: number;
}

export interface GameEvent {
  type: 'playerHit' | 'playerKill' | 'powerUpCollected';
  data: Record<string, unknown>;
}

// ---- Game State ----
export class GameState {
  players: Map<string, PlayerData> = new Map();
  projectiles: Map<string, ProjectileData> = new Map();
  powerUps: Map<string, PowerUpData> = new Map();
  tick = 0;

  addPlayer(id: string, username: string, socketId: string): void {
    const spawn = randomArenaPosition();
    this.players.set(id, {
      id, username, socketId,
      x: spawn.x, y: spawn.y, rotation: 0,
      health: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH,
      kills: 0, deaths: 0, alive: true,
      lastShot: 0, speedMultiplier: 1, damageMultiplier: 1,
      effectTimers: new Map(), respawnTimer: null,
    });
  }

  removePlayer(id: string): void {
    const player = this.players.get(id);
    if (player) {
      // Clear all timers
      for (const timer of player.effectTimers.values()) clearTimeout(timer);
      if (player.respawnTimer) clearTimeout(player.respawnTimer);
      this.players.delete(id);
    }
  }

  applyInput(playerId: string, input: { dx: number; dy: number }, dt: number): void {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;

    const speed = PLAYER_SPEED * player.speedMultiplier * dt;
    let dx = input.dx;
    let dy = input.dy;

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }

    player.x += dx * speed;
    player.y += dy * speed;

    const clamped = clampToArena({ x: player.x, y: player.y }, PLAYER_RADIUS);
    player.x = clamped.x;
    player.y = clamped.y;
  }

  applyRotation(playerId: string, angle: number): void {
    const player = this.players.get(playerId);
    if (player) player.rotation = angle;
  }

  shoot(playerId: string, angle: number): boolean {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return false;

    const now = Date.now();
    if (now - player.lastShot < SHOOT_COOLDOWN) return false;
    player.lastShot = now;

    const projId = uuidv4();
    const spawnDist = PLAYER_RADIUS + PROJECTILE_RADIUS + 5;

    this.projectiles.set(projId, {
      id: projId,
      x: player.x + Math.cos(angle) * spawnDist,
      y: player.y + Math.sin(angle) * spawnDist,
      vx: Math.cos(angle) * PROJECTILE_SPEED,
      vy: Math.sin(angle) * PROJECTILE_SPEED,
      ownerId: playerId,
      createdAt: now,
      damage: PROJECTILE_DAMAGE * player.damageMultiplier,
    });

    return true;
  }

  update(dt: number): GameEvent[] {
    this.tick++;
    const events: GameEvent[] = [];

    // Update projectiles
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, proj] of this.projectiles) {
      // Move
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Lifetime check
      if (now - proj.createdAt > PROJECTILE_LIFETIME) {
        toRemove.push(id);
        continue;
      }

      // Out of bounds
      if (proj.x < 0 || proj.x > ARENA_WIDTH || proj.y < 0 || proj.y > ARENA_HEIGHT) {
        toRemove.push(id);
        continue;
      }

      // Collision with players
      for (const [, player] of this.players) {
        if (player.id === proj.ownerId || !player.alive) continue;
        if (circleCollision(proj as Vec2, PROJECTILE_RADIUS, player as Vec2, PLAYER_RADIUS)) {
          // Hit!
          player.health -= proj.damage;
          toRemove.push(id);

          events.push({
            type: 'playerHit',
            data: { targetId: player.id, shooterId: proj.ownerId, x: proj.x, y: proj.y, damage: proj.damage },
          });

          if (player.health <= 0) {
            player.health = 0;
            player.alive = false;
            player.deaths++;

            const shooter = this.players.get(proj.ownerId);
            if (shooter) shooter.kills++;

            events.push({
              type: 'playerKill',
              data: { victimId: player.id, killerId: proj.ownerId, x: player.x, y: player.y },
            });

            // Schedule respawn
            player.respawnTimer = setTimeout(() => {
              this.respawnPlayer(player.id);
            }, RESPAWN_TIME);
          }
          break;
        }
      }
    }

    for (const id of toRemove) this.projectiles.delete(id);

    // Power-up collisions
    const puToRemove: string[] = [];
    for (const [puId, pu] of this.powerUps) {
      for (const [, player] of this.players) {
        if (!player.alive) continue;
        if (circleCollision(pu as Vec2, POWERUP_RADIUS, player as Vec2, PLAYER_RADIUS)) {
          this.applyPowerUp(player, pu);
          puToRemove.push(puId);
          events.push({
            type: 'powerUpCollected',
            data: { powerUpId: puId, playerId: player.id, type: pu.type, x: pu.x, y: pu.y },
          });
          break;
        }
      }
    }
    for (const id of puToRemove) this.powerUps.delete(id);

    return events;
  }

  private respawnPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const spawn = randomArenaPosition();
    player.x = spawn.x;
    player.y = spawn.y;
    player.health = player.maxHealth;
    player.alive = true;
    player.speedMultiplier = 1;
    player.damageMultiplier = 1;
    player.respawnTimer = null;
    for (const timer of player.effectTimers.values()) clearTimeout(timer);
    player.effectTimers.clear();
  }

  private applyPowerUp(player: PlayerData, pu: PowerUpData): void {
    switch (pu.type) {
      case 'health': {
        const effect = POWERUP_EFFECTS.health;
        player.health = Math.min(player.maxHealth, player.health + effect.healthRestore);
        break;
      }
      case 'speed': {
        const effect = POWERUP_EFFECTS.speed;
        player.speedMultiplier = effect.speedMultiplier;
        const prev = player.effectTimers.get('speed');
        if (prev) clearTimeout(prev);
        player.effectTimers.set('speed', setTimeout(() => {
          player.speedMultiplier = 1;
          player.effectTimers.delete('speed');
        }, effect.duration));
        break;
      }
      case 'damage': {
        const effect = POWERUP_EFFECTS.damage;
        player.damageMultiplier = effect.damageMultiplier;
        const prev = player.effectTimers.get('damage');
        if (prev) clearTimeout(prev);
        player.effectTimers.set('damage', setTimeout(() => {
          player.damageMultiplier = 1;
          player.effectTimers.delete('damage');
        }, effect.duration));
        break;
      }
      case 'shield': {
        const effect = POWERUP_EFFECTS.shield;
        player.health = Math.min(player.maxHealth + effect.shieldAmount, player.health + effect.shieldAmount);
        break;
      }
    }
  }

  spawnPowerUp(): void {
    const types: Array<'health' | 'speed' | 'damage' | 'shield'> = ['health', 'speed', 'damage', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = randomArenaPosition(200);

    this.powerUps.set(uuidv4(), {
      id: uuidv4(),
      x: pos.x,
      y: pos.y,
      type,
    });
  }

  getSnapshot(): GameStateSnapshot {
    const players: GameStateSnapshot['players'] = {};
    for (const [id, p] of this.players) {
      players[id] = {
        id: p.id, username: p.username,
        x: Math.round(p.x), y: Math.round(p.y), rotation: p.rotation,
        health: Math.round(p.health), maxHealth: p.maxHealth,
        kills: p.kills, deaths: p.deaths, alive: p.alive,
      };
    }

    const projectiles = Array.from(this.projectiles.values()).map(p => ({
      id: p.id, x: Math.round(p.x), y: Math.round(p.y),
      vx: Math.round(p.vx), vy: Math.round(p.vy), ownerId: p.ownerId,
    }));

    const powerUps = Array.from(this.powerUps.values()).map(p => ({
      id: p.id, x: p.x, y: p.y, type: p.type,
    }));

    return { players, projectiles, powerUps, tick: this.tick };
  }
}
