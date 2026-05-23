# Allo Inventory Reservation System

A full-stack inventory and order-fulfillment platform built for multi-warehouse retail and D2C brands. Solves the checkout race condition by temporarily holding stock for 10 minutes while payment is processed.

## Live Demo

Coming soon after deployment

## Features

- Product listing with real-time stock per warehouse
- Concurrency-safe reservations using atomic database updates
- 10-minute countdown timer on checkout page
- Confirm purchase or cancel reservation
- Auto-release of expired reservations
- 409 error when stock runs out
- 410 error when reservation expires

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + shadcn/ui

## How to Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/allo-assignment
cd allo-assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

### 4. Run migrations

```bash
npx prisma migrate deploy
```

### 5. Seed the database

```bash
npx prisma db seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

## How Expiry Works in Production

Expired reservations are handled two ways:

1. **Lazy cleanup on read** - When a confirm request comes in for an expired reservation, the API automatically releases it and returns a 410 status code
2. **Cron endpoint** - `GET /api/cron/cleanup` releases all expired pending reservations in bulk. This can be called periodically via Vercel Cron Jobs

## Concurrency Approach

The reservation endpoint uses an atomic `updateMany` with a `where` clause that checks available stock at the database level:

```sql
UPDATE Inventory
SET reserved = reserved + quantity
WHERE id = inventoryId
AND totalStock >= reserved + quantity
```

If two requests arrive simultaneously for the last unit, only one will match the condition and succeed. The other gets a 409 response. No application-level locks needed.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products with stock per warehouse |
| GET | /api/warehouses | List warehouses |
| POST | /api/reservations | Reserve units (409 if insufficient stock) |
| POST | /api/reservations/:id/confirm | Confirm reservation (410 if expired) |
| POST | /api/reservations/:id/release | Release reservation early |
| GET | /api/cron/cleanup | Release all expired reservations |

## Trade-offs and Future Improvements

- Would add Redis distributed locking for stronger concurrency guarantees under very high load
- Would add idempotency keys for reserve and confirm endpoints to handle client retries safely
- Would add proper user authentication
- Would add pagination for product listing at scale
- Would add WebSocket or polling to auto-refresh stock on the product page when reservations expire
