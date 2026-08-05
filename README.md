# Food Order App

Full-stack order management for a food delivery app: browse the menu, manage a cart, checkout with delivery details, and track order status in near real time.

**Stack:** React 19 + Vite (client) · Node.js + Express + MongoDB (server) · Socket.IO · Zod validation · Vitest / Node test runner

---

## Features

| Area | What you get |
|------|----------------|
| Menu | Name, description, price, image; search / category filters |
| Cart | Add items, change quantity, persisted in `localStorage` |
| Checkout | Name, phone, address (+ city / postal); places `POST /api/orders` |
| Order status | Timeline: Order Received → Preparing → Out for Delivery → Delivered |
| Real-time | Socket.IO push + optional back-end status **simulator** |
| Admin | JWT login, dashboard, menu CRUD, manual status updates |
| Storage | MongoDB when connected; in-memory fallback otherwise |
| Tests | API (menu, orders, admin) + UI (menu card, cart, checkout, timeline) |

---

## Project structure

```
food-order-app/
├── client/                 # React + Vite SPA
│   └── src/
│       ├── features/       # menu, cart, order, admin
│       ├── services/       # API clients
│       └── hooks/          # e.g. useOrderStatusSocket
└── server/                 # Express API
    └── src/
        ├── modules/        # menu, order, admin
        ├── models/         # Mongoose schemas
        └── tests/          # API + unit tests
```

---

## Prerequisites

- Node.js 20+
- MongoDB Atlas (or local Mongo) — optional; API falls back to in-memory if disconnected
- npm

---

## Local setup

### 1. Server

```bash
cd server
cp .env.example .env
# Edit MONGO_URI, CORS_ORIGIN, ADMIN_* as needed
npm install
npm run dev
```

API defaults to `http://localhost:3000`.

Useful env flags:

| Variable | Purpose |
|----------|---------|
| `ORDER_STATUS_SIMULATION=true` | Auto-advance status every N ms after place order |
| `ORDER_STATUS_SIMULATION_INTERVAL_MS` | Step interval (default `8000`) |
| `CORS_ORIGIN` | Front-end origin (e.g. `http://localhost:5173`) |
| `SEED_SECRET` | Protect `POST /api/admin/seed` in production |

Bootstrap seeds admin + menu on server start when possible. Default admin (see `.env.example`): `admin` / `admin@2026`.

### 2. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App defaults to `http://localhost:5173`. Leave `VITE_API_URL` empty locally so Vite proxies `/api` → `http://localhost:3000`. Socket.IO connects to `http://localhost:3000` in dev.

---

## How real-time status works

1. Customer places an order → status starts as **Order Received**.
2. If `ORDER_STATUS_SIMULATION=true`, the server schedules **Preparing → Out for Delivery → Delivered** and emits `order:status` on Socket.IO room `order:{id}`.
3. Admin can also `PATCH /api/admin/orders/:id/status` (this cancels the simulator for that order).
4. Track page joins the room via Socket.IO and refreshes the order; polling every 8s is a fallback.

---

## Main API routes

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/menu` | Public menu list |
| `POST` | `/api/orders` | Place order |
| `GET` | `/api/orders/:id` | By Mongo id or `FO-…` reference |
| `POST` | `/api/admin/login` | JWT |
| `PATCH` | `/api/admin/orders/:id/status` | Status update (auth + remarks) |
| `CRUD` | `/api/admin/menu-items` | Admin menu management |

---

## Tests

```bash
# API
cd server && npm test

# UI
cd client && npm test
```

Coverage includes order create/get, delivery validation, status transitions, menu card, cart quantity, checkout validation, and order timeline.

---

## Hosting (deliverable)

Host **two** services:

1. **Client** — Vercel or Netlify (`client/`; SPA rewrite in `client/vercel.json`)
   - Set `VITE_API_URL` to your public API URL (no trailing slash) at build time.
2. **Server** — Render, Railway, Fly.io, etc.
   - Set `MONGO_URI`, `CORS_ORIGIN` to the Vercel/Netlify URL, `ADMIN_JWT_SECRET`, and optionally `ORDER_STATUS_SIMULATION=true` for demos.
3. Put the **live app URL** here once deployed:

> **Live demo:** _add your Vercel/Netlify URL_  
> **API:** _add your Render/Railway URL_

---

## Loom video checklist

Record 12–15 minutes covering:

- Requirement breakdown and folder structure
- Architecture (REST + Socket.IO + simulator + Mongo/in-memory)
- Walk-through of order flow and tests
- How you used AI (generation, tests, debugging) and what you changed by hand
- Challenges (CORS/hosting, real-time vs polling, validation)

---

## License

ISC
