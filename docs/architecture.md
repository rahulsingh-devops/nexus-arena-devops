# 🏗️ Architecture

## Overview

Nexus Arena is a **real-time multiplayer top-down arena shooter** built as a full-stack web application. It follows a client-server architecture with an authoritative game server.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Game Engine** | Phaser.js 3 | 2D game rendering & physics |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Build Tool** | Vite | Fast dev server & bundler |
| **Backend** | Node.js 20 + Express | API server |
| **Real-time** | Socket.IO | WebSocket communication |
| **Auth** | JWT (RS256) | Token-based authentication |
| **Database** | PostgreSQL 15 | Player accounts & match history |
| **Cache** | Redis 7 | Room state, sessions, pub/sub |
| **Monitoring** | Prometheus + Grafana | Metrics & dashboards |
| **Containers** | Docker + Docker Compose | Local development |
| **Orchestration** | Kubernetes + Helm | Production deployment |
| **IaC** | Terraform | AWS/GCP provisioning |
| **CI/CD** | GitHub Actions | Automated pipelines |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER CLIENT                          │
│     React 18 + Phaser.js 3 + Socket.IO Client + Tailwind    │
└──────────────────────────┬──────────────────────────────────┘
                           │  WebSocket + REST
┌──────────────────────────▼──────────────────────────────────┐
│                      GAME SERVER                             │
│     Node.js 20 + Socket.IO + Express + JWT Auth              │
│     Authoritative game state @ 20 ticks/sec                  │
├──────────────┬──────────────────────────────┬───────────────┤
│   Redis 7    │       PostgreSQL 15          │  Prometheus   │
│  Room state  │   Player accounts & stats    │   Metrics     │
│  Sessions    │   Match history              │               │
│  Pub/Sub     │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

---

## Data Flow

### 1. Authentication Flow
1. Player registers/logs in via REST API (`POST /api/auth/register` or `/login`)
2. Server validates credentials, returns a JWT
3. JWT is attached to Socket.IO handshake for real-time authorization

### 2. Game Loop
1. **Client** captures player input (movement direction, shoot action)
2. **Client** sends input to server via Socket.IO (`player:input`)
3. **Server** validates input, updates authoritative game state
4. **Server** broadcasts delta state to all players in room (20 ticks/sec)
5. **Client** interpolates and renders updated state

### 3. Room Lifecycle
1. Host creates a room → Server allocates a `GameRoom` instance
2. Players join via room code → Server adds them to the room
3. Host starts the game → Server begins the game loop
4. Game ends (last player standing) → Server broadcasts results
5. Room is cleaned up after all players disconnect

---

## Folder Structure

```
nexus-arena/
├── frontend/                 # React + Phaser.js client
│   ├── src/
│   │   ├── game/             # Phaser scenes, config, game objects
│   │   ├── components/       # React UI components (Lobby, HUD, etc.)
│   │   └── hooks/            # Custom React hooks (useSocket, etc.)
│   ├── Dockerfile
│   └── vite.config.ts
├── backend/                  # Node.js game server
│   ├── src/
│   │   ├── game/             # GameRoom, GameState, physics engine
│   │   ├── socket/           # Socket.IO event handlers
│   │   ├── routes/           # REST API routes (auth, health)
│   │   ├── services/         # Auth, Redis, DB services
│   │   └── middleware/       # JWT auth middleware
│   └── Dockerfile
├── infra/                    # Infrastructure-as-Code
│   ├── docker-compose.yml    # Local development stack
│   ├── k8s/                  # Raw Kubernetes manifests
│   ├── helm/nexus-arena/     # Helm chart for production
│   ├── terraform/            # AWS + GCP provisioning
│   └── monitoring/           # Prometheus + Grafana configs
├── docs/                     # Project documentation
├── .github/workflows/        # CI/CD pipelines
└── README.md
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Authoritative server** | Prevents cheating — clients never own game state |
| **Client-side prediction** | Keeps gameplay feeling responsive despite network latency |
| **20 tick/sec loop** | Balance between responsiveness and bandwidth usage |
| **Delta state broadcasts** | Only changed properties are sent, reducing payload size |
| **Redis pub/sub** | Enables horizontal scaling — multiple server pods can share room state |
| **JWT on WebSocket** | Stateless auth that works for both REST and real-time layers |
