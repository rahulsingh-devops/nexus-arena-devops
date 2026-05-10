// Server-side physics constants and collision detection

export const ARENA_WIDTH = 2000;
export const ARENA_HEIGHT = 2000;

export const PLAYER_SPEED = 300;       // pixels per second
export const PLAYER_RADIUS = 20;
export const PLAYER_MAX_HEALTH = 100;
export const RESPAWN_TIME = 3000;      // ms

export const PROJECTILE_SPEED = 600;   // pixels per second
export const PROJECTILE_RADIUS = 5;
export const PROJECTILE_DAMAGE = 25;
export const PROJECTILE_LIFETIME = 2000; // ms
export const SHOOT_COOLDOWN = 250;     // ms between shots

export const POWERUP_RADIUS = 16;
export const POWERUP_SPAWN_INTERVAL = 10000; // ms
export const MAX_POWERUPS = 8;

export const POWERUP_EFFECTS = {
  health: { healthRestore: 40 },
  speed: { speedMultiplier: 1.5, duration: 5000 },
  damage: { damageMultiplier: 2, duration: 5000 },
  shield: { shieldAmount: 30 },
} as const;

export interface Vec2 {
  x: number;
  y: number;
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function circleCollision(a: Vec2, aRadius: number, b: Vec2, bRadius: number): boolean {
  return distance(a, b) < aRadius + bRadius;
}

export function clampToArena(pos: Vec2, radius: number): Vec2 {
  return {
    x: Math.max(radius, Math.min(ARENA_WIDTH - radius, pos.x)),
    y: Math.max(radius, Math.min(ARENA_HEIGHT - radius, pos.y)),
  };
}

export function normalizeVector(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function randomArenaPosition(padding = 100): Vec2 {
  return {
    x: padding + Math.random() * (ARENA_WIDTH - padding * 2),
    y: padding + Math.random() * (ARENA_HEIGHT - padding * 2),
  };
}
