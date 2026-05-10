# 🎮 NEXUS ARENA

> **Real-time multiplayer top-down arena shooter** — browser-based, production-ready, fully containerized.

Up to 20 players per room battle in fast-paced arenas. Collect power-ups, eliminate opponents, last player standing wins.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER CLIENT                       │
│  React 18 + Phaser.js 3 + Socket.IO Client + Tailwind   │
└──────────────────────┬──────────────────────────────────┘
                       │  WebSocket + REST
┌──────────────────────▼──────────────────────────────────┐
│                     GAME SERVER                          │
│  Node.js 20 + Socket.IO + Express + JWT Auth             │
│  Authoritative game state @ 20 ticks/sec                 │
├─────────────┬───────────────────────────────┬───────────┤
│   Redis 7   │      PostgreSQL 15            │ Prometheus│
│ Room state  │  Player accounts & stats      │  Metrics  │
│ Sessions    │  Match history                │           │
│ Pub/Sub     │                               │           │
└─────────────┴───────────────────────────────┴───────────┘
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for IDE support)
- Git

### Steps

```bash
# 1. Clone the repo
git clone <your-repo-url> && cd nexus-arena

# 2. Set up environment
cp .env.example .env

# 3. Start the full stack
docker compose up

# 4. Play!
# Open http://localhost:5173 in two browser tabs
# Register two accounts, create a room, and start playing
```

### Service URLs (Local)

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:3001       |
| Health     | http://localhost:3001/health|

---

## 📁 Project Structure

```
nexus-arena/
├── frontend/                # React + Phaser.js client
│   ├── src/
│   │   ├── game/            # Phaser scenes and game objects
│   │   ├── components/      # React UI components
│   │   └── hooks/           # Socket.IO hooks
│   ├── Dockerfile
│   └── vite.config.ts
├── backend/                 # Node.js game server
│   ├── src/
│   │   ├── socket/          # Socket.IO event handlers
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Redis and DB services
│   │   └── game/            # Server-side game logic
│   └── Dockerfile
├── infra/
│   ├── docker-compose.yml   # Local dev stack
│   ├── k8s/                 # Kubernetes manifests
│   ├── helm/nexus-arena/    # Helm chart
│   ├── terraform/
│   │   ├── aws/             # EKS + RDS + ElastiCache
│   │   └── gcp/             # GKE + Cloud SQL + Memorystore
│   └── monitoring/          # Prometheus + Grafana
├── .github/workflows/       # CI/CD pipelines
└── README.md
```

---

## 🎮 Game Architecture

- **Authoritative Server**: All game state lives on the server. Clients send inputs only (move direction, shoot). Server validates, updates, and broadcasts.
- **Client Prediction**: Client predicts own movement locally for responsiveness. Server reconciles on each state update.
- **Tick Rate**: Server runs at 20 ticks/sec (50ms loop). Broadcasts delta state only.
- **Rooms**: Each room is an isolated game instance. Redis pub/sub enables cross-pod room state.
- **Reconnection**: Players can rejoin their room within 30s of disconnect.

---

## 🔐 Security

| Layer          | Implementation                                                |
|----------------|---------------------------------------------------------------|
| Auth           | JWT (RS256) on all REST endpoints and Socket.IO handshake     |
| Transport      | HTTPS enforced; HTTP → HTTPS redirect via ingress             |
| Secrets        | Kubernetes Secrets (base64), Terraform reads from cloud vaults|
| Network        | NetworkPolicy: backend pods only reachable from ingress       |
| Rate Limiting  | 100 req/min per IP (REST), 60 events/sec per socket           |
| Input          | DOMPurify (frontend) + validator.js (backend)                 |
| CI Secrets     | OIDC federation — no static IAM keys                          |
| Containers     | Non-root user, read-only root filesystem                      |

---

## 🌍 Environment Variables

| Variable          | Description                           | Default (Dev)             |
|-------------------|---------------------------------------|---------------------------|
| `DATABASE_URL`    | PostgreSQL connection string          | `postgresql://...`        |
| `REDIS_URL`       | Redis connection string               | `redis://redis:6379`      |
| `JWT_SECRET`      | Secret for signing JWT tokens         | (generate a long random)  |
| `PORT`            | Backend port                          | `3001`                    |
| `NODE_ENV`        | Environment                           | `development`             |
| `VITE_BACKEND_URL`| Backend URL for frontend              | `ws://localhost:3001`     |

---

## 🚢 Production Deployment

1. **Provision infrastructure** — Run Terraform for AWS or GCP
2. **Note outputs** — EKS/GKE cluster name, DB endpoint, Redis endpoint, registry URL
3. **Update Helm values** — Edit `infra/helm/nexus-arena/values.prod.yaml`
4. **Push to main** — GitHub Actions CD pipeline fires automatically
5. **Monitor** — `kubectl rollout status deployment/nexus-arena-backend`
6. **Verify** — `curl https://your-domain.com/health`
7. **Dashboards** — Open Grafana and confirm metrics are flowing

---

## 📊 Monitoring

- **Prometheus** scrapes `/metrics` every 15s
- **Key metrics**: `active_rooms`, `active_players`, `socket_events_per_sec`, `game_tick_duration_ms`, `http_request_duration_ms`
- **Alerts**: Pod CrashLoopBackOff, p99 tick > 100ms, active_players > 500

---

## 🔧 Extending

| Feature         | How                                                                         |
|-----------------|-----------------------------------------------------------------------------|
| New weapon      | Add type to shared types, server damage handler, Phaser sprite on frontend  |
| Matchmaking     | ELO-based service with Redis sorted set, wire to room assignment            |
| Match history   | Connect results to PostgreSQL, REST endpoint, React profile page            |
| Multi-region    | Terraform to multiple regions, Route53 latency routing, Redis Cluster       |
| AI bots         | Node.js bot service via Socket.IO, state machine (roam, chase, flee)        |
| Mobile support  | Virtual joystick (nipplejs), responsive Phaser canvas, touch events         |

---

**Version 1.0 | 2026**
