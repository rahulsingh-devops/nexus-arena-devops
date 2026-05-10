# 🚢 Deployment Guide

## Table of Contents
- [Local Development](#local-development)
- [Docker Compose](#docker-compose)
- [Production (Kubernetes)](#production-kubernetes)

---

## Local Development

### Prerequisites
- **Node.js 20+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd nexus-arena

# Set up environment variables
cp .env.example .env

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App opens on http://localhost:5173
```

### Testing
Open two browser tabs at `http://localhost:5173`, register two accounts, create a room, and join with the second account.

---

## Docker Compose

For a full-stack local environment with PostgreSQL and Redis:

### Prerequisites
- **Docker** — [Download](https://www.docker.com/)
- **Docker Compose** (v2, bundled with Docker Desktop)

### Running

```bash
cd nexus-arena

# Copy environment file
cp .env.example .env

# Start all services
docker compose up

# Or run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | Vite dev server |
| Backend | 3001 | Node.js API + WebSocket |
| PostgreSQL | 5432 | Player database |
| Redis | 6379 | Room state & sessions |

---

## Production (Kubernetes)

### Prerequisites
- **kubectl** configured for your cluster
- **Helm 3**
- **Terraform** (for cloud provisioning)

### 1. Provision Infrastructure

**AWS:**
```bash
cd infra/terraform/aws
terraform init
terraform plan
terraform apply
```

**GCP:**
```bash
cd infra/terraform/gcp
terraform init
terraform plan
terraform apply
```

### 2. Configure Helm Values

Edit `infra/helm/nexus-arena/values.prod.yaml`:
```yaml
backend:
  image:
    repository: your-registry/nexus-arena-backend
    tag: latest
  env:
    DATABASE_URL: "postgresql://..."
    REDIS_URL: "redis://..."
    JWT_SECRET: "your-production-secret"

frontend:
  image:
    repository: your-registry/nexus-arena-frontend
    tag: latest
  env:
    VITE_BACKEND_URL: "wss://your-domain.com"
```

### 3. Deploy with Helm

```bash
helm upgrade --install nexus-arena \
  infra/helm/nexus-arena \
  -f infra/helm/nexus-arena/values.prod.yaml \
  -n nexus-arena \
  --create-namespace
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n nexus-arena

# Check rollout
kubectl rollout status deployment/nexus-arena-backend -n nexus-arena

# Verify health
curl https://your-domain.com/health
```

### 5. Monitoring

```bash
# Deploy Prometheus + Grafana
kubectl apply -f infra/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring
# Open http://localhost:3000 (admin/admin)
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `JWT_SECRET` | **Yes** | — | Secret for JWT signing |
| `DATABASE_URL` | No | In-memory fallback | PostgreSQL connection string |
| `REDIS_URL` | No | In-memory fallback | Redis connection string |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `VITE_BACKEND_URL` | **Yes** | `http://localhost:3001` | Backend URL for frontend |
