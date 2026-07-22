# Hestia — Project Notes for Agents

## Tech Stack
- Backend: Node.js + Express + Mongoose + Socket.io
- Frontend: React + Vite + Tailwind CSS + React Router
- Database: MongoDB (dev uses `mongodb-memory-server` if `USE_MEMORY_DB=true`)

## How to run locally

### Backend
```bash
cd server
npm install
npm start        # http://localhost:5000
```

### Frontend
```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`.

## Default credentials
- Superadmin: `superadmin` / `superadmin123`
- Admin: `admin` / `admin123`
- Demo hotel is seeded automatically on first backend start (`slug: demo`).

## Important environment variables
Copy `server/.env.example` to `server/.env` and update `JWT_SECRET` for production.
Set `USE_MEMORY_DB=false` and `MONGO_URI` to your real MongoDB instance.
Set `CLIENT_URL` to the frontend origin (e.g. `http://localhost:5173`) to restrict CORS in production.
For push notifications, generate VAPID keys with `npx web-push generate-vapid-keys` and fill `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`.

## Lint & format
```bash
cd client
npm run lint
npm run format
```

## Backend tests
```bash
cd server
npm test
```

## Docker / production deploy
A root `Dockerfile` builds the client and serves both frontend and backend from port 5000.
```bash
docker build -t hestia .
docker run -p 5000:5000 -e NODE_ENV=production -e MONGO_URI=... -e JWT_SECRET=... -e VAPID_PUBLIC_KEY=... -e VAPID_PRIVATE_KEY=... hestia
```
Set `CLIENT_URL` to your deployed domain in production.

## Deploy on Render
1. Create a MongoDB Atlas cluster (M0 free tier) and copy the connection string.
2. In Render, create a new **Web Service** from this repo.
3. Use the root `Dockerfile` or import the `render.yaml` blueprint.
4. Set environment variables in Render:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CLIENT_URL=https://<your-service>.onrender.com`
   - `MONGO_URI=...`
   - `JWT_SECRET=<min-32-chars>`
   - `ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=...`
   - `SUPERADMIN_USERNAME=superadmin` and `SUPERADMIN_PASSWORD=...`
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (optional)
   - `SMS_PROVIDER=console` (or `twilio` with `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`)
5. Deploy. The Dockerfile builds the React app and serves it with the Express server.

**Note:** Render free tier spins down after inactivity and will take ~30s to wake up. For a sales demo, consider the **Starter** plan for 24/7 uptime.

## CI
`.github/workflows/ci.yml` runs backend tests, frontend lint and build on push/PR.

## Key URLs
- Landing: `http://localhost:5173/`
- Demo: `http://localhost:5173/demo`
- Guest room: `http://localhost:5173/room/:uuid`
- Staff login: `http://localhost:5173/admin/login`
