# PayLink Production Upgrade

![CI/CD](https://github.com/tsushumi/production-upgrade/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen)
[![Uptime Robot](https://badge.uptimerobot.com/psp/2c2f6e255324cae3ab4e35f9b1f7837e.svg?style=logo&theme=dark)](https://stats.uptimerobot.com/kX18wwBvlu)

A production-grade Express + React payments API with automated linting, testing and deployment, Sentry error tracking, UptimeRobot monitoring, Pino structured logging, rate limiting and a staging flow.


## Deployments

| What | URL |
| --- | --- |
| Frontend (Vercel) | https://client-gamma-wine-88.vercel.app/ |
| API health (Render) | https://paylink-api-4ogn.onrender.com/api/health |
| Status page (UptimeRobot) | https://stats.uptimerobot.com/kX18wwBvlu |

## Tech stack

- **Backend:** Node.js 20, Express 4, JWT auth, express-rate-limit
- **Frontend:** React 18 + Vite
- **Testing:** Vitest, supertest, @vitest/coverage-v8 (70% threshold enforced in CI)
- **CI/CD:** GitHub Actions, lint -> test -> build -> deploy, Discord deploy notification
- **Monitoring:** Sentry (`@sentry/node`, `@sentry/react` with browser tracing), UptimeRobot
- **Logging:** Pino (pretty in development, JSON in production)
- **Hosting:** Vercel (frontend) + Render (backend)

## Setup

```bash
git clone https://github.com/tsushumi/production-upgrade-v1.git
npm install
cp .env.example .env      # set JWT_SECRET at minimum
npm run dev               # API on http://localhost:5000

cd client && npm install && npm run dev   # frontend on http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Run the API |
| `npm run dev` | Run with nodemon and pretty logs |
| `npm run lint` | ESLint |
| `npm test` | All tests (Vitest) |
| `npm run test:coverage` | Tests with coverage, fails under 70% |
| `npm run build` | Install and build the React client |

## Health endpoint

`GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-10-30T12:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "environment": "production"
}
```

## API

| Method | Route | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | none |
| POST | `/api/auth/login` | none |
| GET | `/api/payments` | Bearer token |
| POST | `/api/payments` | Bearer token |

All `/api` routes are rate limited (default 100 requests per 15 minutes per IP, configurable with `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`). The health endpoint is exempt so uptime monitors are never blocked.

## CI/CD pipeline

```
lint -> test (coverage gate) -> build -> deploy (main pushes only) -> Discord notification
```

- Runs on pushes to `main` and `staging`, and on pull requests to `main`.
- Deploy never runs on pull requests.
- Optional secrets: `DISCORD_WEBHOOK_URL`, `RENDER_DEPLOY_HOOK_URL`. Optional repository variable: `FRONTEND_URL` (shown in the Discord message). Each step skips cleanly when unset.

## Project structure

```
.github/workflows/ci.yml   CI/CD pipeline
instrument.js              Sentry init (first import in server.js)
server.js / app.js         entry point / Express app (exported for tests)
lib/                       logger, validators, in-memory store
middleware/                requestLogger, rateLimiter, auth
routes/                    auth, payments
utils/helpers.js           formatAmount, slugify, truncate, isValidEmail
scripts/notify-discord.sh  deployment notification
tests/{unit,api,integration}
client/                    React app with Sentry.ErrorBoundary
```

See [STAGING.md](STAGING.md) for Render, Vercel, Sentry, UptimeRobot and staging setup.
