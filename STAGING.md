# Staging and deployment guide

## Branch flow
feature branch -> PR into `staging` -> CI (lint, test, build) -> staging deploy verified -> PR `staging` into `main` -> production deploy.

```bash
git checkout -b staging && git push -u origin staging
git checkout -b feature/small-change     # make a small change
git push -u origin feature/small-change  # open PR into staging, merge when CI is green
# verify the staging URLs, then open a PR staging -> main and merge
```

CI (`.github/workflows/ci.yml`) runs on pushes to `main` and `staging` and on PRs to `main`.

## GitHub (secrets and variables)
Settings -> Secrets and variables -> Actions:
- Secret `DISCORD_WEBHOOK_URL` (Discord: channel settings -> Integrations -> Webhooks) enables the deploy notification.
- Secret `RENDER_DEPLOY_HOOK_URL` (optional) makes Render deploy only after the pipeline is green.
- Variable `FRONTEND_URL` is the Vercel URL shown in the notification.
Repository settings -> Branches: require the `Test` check before merging into `main`.

## Render (backend)
1. Production service: New Web Service, repo root, branch `main`, build `npm ci`, start `npm start`, health check path `/api/health`.
2. Staging service: duplicate the service, branch `staging`, name `paylink-api-staging`.
3. Env vars on each service: `NODE_ENV=production`, `JWT_SECRET`, `LOG_LEVEL=info`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT` (`production` / `staging`), `CORS_ORIGIN` (the matching Vercel URL).
4. Auto-Deploy: "After CI checks pass" so a red CI never deploys.

## Vercel (frontend)
1. Root directory `client`, framework Vite.
2. Env vars: `VITE_API_URL` (Render URL), `VITE_SENTRY_DSN`, `VITE_APP_ENV`.
   Use the staging Render URL for the Preview environment and the production URL for Production.
3. Pushes to `main` deploy to production; `staging` and PR branches get preview deployments automatically.

## Sentry
- Create two projects: Node (backend) and React (frontend). Put each DSN in the env vars above.
- Backend: set `ENABLE_SENTRY_DEBUG=true` on staging, hit `/api/debug-sentry`, confirm the error (with stack trace) appears, then remove the variable and delete the debug route block in `app.js`.
- Frontend: build once with `VITE_ENABLE_SENTRY_TEST=true`, click "Trigger test error", confirm it appears, then unset it and delete the `Bomb` component and button in `App.jsx`.
- Screenshot the issue page showing the stack trace for submission.

## UptimeRobot
1. Monitor 1: HTTP(s) `https://<api>.onrender.com/api/health`, keyword `ok`, 5 min interval.
2. Monitor 2: HTTP(s) `https://<app>.vercel.app`.
3. Status Pages -> create a public page containing both monitors; copy the URL.
4. Alert test: change monitor 1's URL to a bad path, wait for the down email, then restore it.
Render free instances sleep, so the 5 minute ping also keeps the API warm.

## Verifying Pino logs on Render
Render dashboard -> service -> Logs. Production logs are JSON lines (`level`, `time`, `msg`, `requestId`, `statusCode`, `durationMs`). Hit `/api/health` and confirm a `GET /api/health 200` line appears. Set `LOG_LEVEL=warn` to see only warnings and errors.

## Evidence (screenshots and URLs)
1. Live frontend URL -> https://client-gamma-wine-88.vercel.app/
2. Frontend error screenshot `![Frontend error](docs/screenshots/2-frontend-error.png)`
3. Live API URL -> https://paylink-api-4ogn.onrender.com/
4. Backend error screeenshot: `![Backend error](docs/screenshots/4-backend-error.png)`
5. Sentry project backend error URL -> https://tboat-bs.sentry.io/issues/157650459/events/acd78885a26c4044b0e7f072bd8d5805/
6. Sentry project frontend error URL -> https://tboat-bs.sentry.io/issues/157656258/events/77f8180a648a4cc882486a7bfb8e4b5d/
7. UptimeRobot status page URL -> https://stats.uptimerobot.com/kX18wwBvlu
8. UptimeRobot dashboard with both monitors Up screenshot: `![UptimeRobot](docs/screenshots/8-uptimerobot.png)`
9. The "down" alert email screenshot: `![Down alert](docs/screenshots/9-down-email.png)`
10. Email alerts configured for both monitors screenshot: `![Email alerts configured for both monitors](docs/screenshots/10-email-alerts-config.png)`
11. Screenshot of a successful GitHub Actions workflow run: `![Successful workflow](docs/screenshots/11-successful-workflow.png)`
12. Screenshot of Pino logs on Render: `![Pino logs on Render](docs/screenshots/12-Pino logs.png)`