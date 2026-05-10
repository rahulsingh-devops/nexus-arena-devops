# 🔌 API Reference

## REST Endpoints

Base URL: `http://localhost:3001`

---

### Health Check

```
GET /health
```

**Response**: `200 OK`
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2026-05-10T12:00:00Z"
}
```

---

### Authentication

#### Register

```
POST /api/auth/register
Content-Type: application/json
```

**Body**:
```json
{
  "username": "player1",
  "password": "securepassword"
}
```

**Response**: `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "player1"
  }
}
```

#### Login

```
POST /api/auth/login
Content-Type: application/json
```

**Body**:
```json
{
  "username": "player1",
  "password": "securepassword"
}
```

**Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "player1"
  }
}
```

---

## WebSocket Events (Socket.IO)

Connection URL: `ws://localhost:3001`

All Socket.IO connections require a valid JWT token in the handshake:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

---

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ maxPlayers?: number }` | Create a new game room |
| `room:join` | `{ roomId: string }` | Join an existing room |
| `room:leave` | — | Leave the current room |
| `game:start` | — | Start the game (host only) |
| `player:input` | `{ dx: number, dy: number, shooting: boolean, angle: number }` | Send player input |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `{ roomId: string, players: Player[] }` | Room successfully created |
| `room:joined` | `{ roomId: string, players: Player[] }` | Successfully joined room |
| `room:player-joined` | `{ player: Player }` | Another player joined |
| `room:player-left` | `{ playerId: string }` | A player left the room |
| `game:started` | `{ state: GameState }` | Game has started |
| `game:state` | `{ players: PlayerState[], projectiles: Projectile[], powerUps: PowerUp[] }` | Game state update (20/sec) |
| `game:player-eliminated` | `{ playerId: string, by: string }` | A player was eliminated |
| `game:over` | `{ winner: Player, stats: MatchStats }` | Game ended |
| `error` | `{ message: string }` | Error message |

---

## Data Types

### Player
```typescript
interface Player {
  id: string;
  username: string;
  isHost: boolean;
}
```

### PlayerState
```typescript
interface PlayerState {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  score: number;
  alive: boolean;
}
```

### Projectile
```typescript
interface Projectile {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}
```

### PowerUp
```typescript
interface PowerUp {
  id: string;
  type: 'health' | 'speed' | 'damage' | 'shield';
  x: number;
  y: number;
  active: boolean;
}
```

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| REST API | 100 requests/min per IP |
| Socket.IO events | 60 events/sec per socket |

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_REQUIRED` | Authentication required | No JWT token provided |
| `AUTH_INVALID` | Invalid token | JWT verification failed |
| `ROOM_NOT_FOUND` | Room not found | Room ID doesn't exist |
| `ROOM_FULL` | Room is full | Room has reached max players |
| `NOT_HOST` | Only host can start | Non-host tried to start game |
| `GAME_IN_PROGRESS` | Game already in progress | Tried to join active game |
