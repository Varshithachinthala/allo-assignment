# Allo Inventory Reservation System

## How to run locally

1. Clone the repo
2. Install dependencies: npm install
3. Set up .env with DATABASE_URL
4. Run migrations: npx prisma migrate deploy
5. Seed: npx prisma db seed
6. Start: npm run dev

## Expiry mechanism

Lazy cleanup on read — when confirm is called on an expired reservation, it auto-releases and returns 410. A /api/cron/cleanup endpoint releases all expired reservations in bulk and can be called via Vercel Cron.

## Concurrency

Atomic updateMany with a where clause checking available stock. Only one of two simultaneous requests will match and succeed — the other gets 409.

## Trade-offs

- Would add Redis distributed locking for very high load
- Would add idempotency keys
- Would add authentication
- Would add pagination
