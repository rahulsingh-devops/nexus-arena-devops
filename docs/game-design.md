# 🎮 Game Design Document

## Overview

Nexus Arena is a **top-down 2D arena shooter** where up to 20 players battle in real-time. Last player standing wins.

---

## Core Mechanics

### Movement
- **Type**: 8-directional (WASD or arrow keys)
- **Speed**: 200 units/sec (base), modified by power-ups
- **Collision**: Players collide with arena walls but pass through each other

### Shooting
- **Input**: Left mouse button to fire
- **Aiming**: Mouse cursor determines aim direction
- **Fire rate**: 1 shot every 250ms (base)
- **Projectile speed**: 400 units/sec
- **Damage**: 25 HP per hit (base)
- **Projectile lifetime**: 2 seconds (despawn after)

### Health
- **Max HP**: 100
- **Regeneration**: None (must collect health power-up)
- **Elimination**: Player is removed from the game at 0 HP

---

## Power-Ups

Power-ups spawn randomly on the arena every 10 seconds. Maximum 5 active power-ups at a time.

| Power-Up | Effect | Duration | Visual |
|----------|--------|----------|--------|
| ❤️ **Health** | Restore 50 HP | Instant | Red orb |
| ⚡ **Speed** | 1.5× movement speed | 8 seconds | Yellow orb |
| 💥 **Damage** | 2× projectile damage | 8 seconds | Orange orb |
| 🛡️ **Shield** | Block next 2 hits | Until used | Blue orb |

---

## Arena

- **Size**: 1200 × 800 units
- **Layout**: Open arena with scattered obstacles (walls/crates)
- **Spawn points**: Players spawn at random positions along the arena edges
- **Minimum spawn distance**: 200 units from any other player

---

## Game Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  LOBBY   │────▶│  WARMUP  │────▶│  BATTLE  │────▶│ RESULTS  │
│          │     │  (3 sec) │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
 Create room     Countdown        Fight until       Show winner
 Join room       Spawn players    1 player left     Display stats
 Ready up                                           Return to lobby
```

### Lobby Phase
- Host creates a room (receives a 6-char room code)
- Other players join using the room code
- Minimum 2 players to start
- Maximum 20 players per room
- Host clicks "Start Game" to begin

### Warmup Phase (3 seconds)
- All players spawn at their positions
- 3-2-1 countdown displayed
- Players cannot move or shoot

### Battle Phase
- Free-for-all combat
- Power-ups begin spawning
- Eliminated players become spectators
- Game ends when 1 player remains

### Results Phase
- Winner announcement
- Match statistics displayed (kills, damage dealt, survival time)
- Players return to lobby

---

## Scoring

| Action | Points |
|--------|--------|
| Eliminate a player | +100 |
| Collect a power-up | +10 |
| Survive (per second) | +1 |

---

## Networking Model

### Authoritative Server
The server owns all game state. Clients only send input, never directly modify state.

### Client-Side Prediction
To hide latency, the client immediately applies its own movement locally. When the server sends its authoritative state, the client reconciles:
1. Compare predicted position with server position
2. If difference > threshold, snap to server position
3. Replay any unacknowledged inputs

### Interpolation
Other players' positions are interpolated between the last two server states to create smooth movement despite the 50ms tick interval.

---

## Future Considerations

- **Team Mode**: 2v2, 5v5 team battles
- **New Weapons**: Shotgun (spread), Sniper (piercing), Grenade (AoE)
- **Maps**: Multiple arena layouts with different obstacle placements
- **Ranked Mode**: ELO-based matchmaking
- **AI Bots**: Fill empty slots with difficulty-scaled bots
