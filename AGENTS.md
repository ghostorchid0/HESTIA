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
- Admin: `admin` / `admin123`
- Rooms are seeded automatically on first backend start.

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

## Key URLs
- Guest room: `http://localhost:5173/room/:uuid`
- Staff login: `http://localhost:5173/admin/login`
