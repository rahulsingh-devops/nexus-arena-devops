# 🤝 Contributing Guide

Thank you for your interest in contributing to Nexus Arena! This guide will help you get started.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature or fix
4. **Make changes** and test them
5. **Submit a Pull Request**

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/nexus-arena.git
cd nexus-arena

# Set up environment
cp .env.example .env

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

See the [Deployment Guide](./deployment.md) for full setup instructions.

---

## Branch Naming Convention

```
feature/<short-description>    # New features
fix/<short-description>        # Bug fixes
docs/<short-description>       # Documentation updates
refactor/<short-description>   # Code refactoring
```

**Examples:**
- `feature/team-mode`
- `fix/reconnection-bug`
- `docs/api-reference-update`

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(game): add shotgun weapon type
fix(socket): resolve reconnection race condition
docs(api): update WebSocket event documentation
chore(deps): upgrade Socket.IO to v4.8
```

---

## Code Style

- **TypeScript** for all source code
- **ESLint** for linting
- **Prettier** for formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

---

## Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code completed
- [ ] Comments added for complex logic
- [ ] No new warnings introduced
- [ ] Tests pass locally
- [ ] Documentation updated if needed

---

## Project Structure

Understanding the codebase:

- **`backend/src/game/`** — Server-side game logic (GameRoom, GameState, physics)
- **`backend/src/socket/`** — Socket.IO event handlers
- **`backend/src/routes/`** — REST API endpoints
- **`backend/src/services/`** — Business logic services (auth, Redis, DB)
- **`frontend/src/game/`** — Phaser.js scenes and game objects
- **`frontend/src/components/`** — React UI components
- **`frontend/src/hooks/`** — Custom React hooks

---

## Need Help?

- Open an **Issue** for bug reports or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in all interactions
