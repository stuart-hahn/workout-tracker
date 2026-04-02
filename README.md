# Workout Tracker

Mobile-first workout tracker for logging sets/reps/weight/RIR, tracking weekly volume by muscle group, and following double progression.

## Stack

- Next.js (App Router) single app (UI + API routes)
- Prisma + SQLite
- Email/password auth (argon2) + DB-backed sessions (HTTP-only cookie)
- Dockerized deployment

## Local development

### 1) Install deps

```bash
npm install
```

### 2) Set env

`.env` is created by Prisma. Default is fine for local dev:

```bash
DATABASE_URL="file:./dev.db"
```

### 3) Migrate DB

```bash
npx prisma migrate dev
```

### 4) Seed sample data

Creates a demo user, the Upper/Lower 4-day template, and a couple historical sessions. Running `db:seed` again **replaces** that user’s programs and workout history (idempotent for the demo account).

```bash
npm run db:seed
```

### Reset database (development only)

**Destructive:** drops all data, reapplies migrations, then seeds. Uses whatever `DATABASE_URL` points at (typically `file:./dev.db`). Do not use against production.

```bash
npm run db:reset
```

Demo credentials:

- Email: `demo@example.com`
- Password: `password123`

### 5) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Docker (recommended: compose)

This uses a persistent Docker volume for the SQLite database at `/data/sqlite.db`.

```bash
docker compose up --build
```

Then open `http://localhost:3000`.

### Notes

- The container runs `prisma migrate deploy` on startup.
- To seed inside Docker, run:

```bash
docker compose exec app npm run db:seed
```

## Features (current)

- Register/login/logout
- Seeded editable program template (stored in DB)
- Start a workout from `Today`, log sets, reps, weight, and RIR
- Weekly volume screen (`Volume`) computed from completed set logs
- Double-progression recommendation (shown per exercise while logging)

## Folder structure

```text
.
├─ prisma/
│  ├─ migrations/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ analytics/volume/
│  │  ├─ login/
│  │  ├─ register/
│  │  ├─ today/
│  │  └─ workouts/[id]/
│  └─ lib/
│     ├─ analytics/
│     ├─ auth/
│     ├─ program/
│     └─ progression/
├─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
