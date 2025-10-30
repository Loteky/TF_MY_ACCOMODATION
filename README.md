# Naval House Handover (NHH)

Private accommodation handover platform for Nigerian Navy officers. The solution comprises a NestJS API with Prisma/PostgreSQL, JWT authentication, RBAC, Google Drive integration for imagery, and a Next.js dashboard for officers and command staff.

## Repository layout

```
TF_MY_ACCOMODATION/
├── backend/              # NestJS API, Prisma schema, tests
├── frontend/             # Next.js web dashboard
├── docs/openapi.yaml     # REST interface contract
├── infra/docker-compose.yml
├── Makefile              # Helpful automation targets
└── README.md
```

## Getting started with Docker

1. Copy environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Adjust secrets (JWT keys, Google credentials) as required. Enable `GOOGLE_DRIVE_MOCK=true` for offline development.
3. Launch the full stack:
   ```bash
   make docker-up
   ```
   Services exposed locally:
   * API: <http://localhost:4000/api>
   * Web: <http://localhost:3000>
   * Postgres: `localhost:5432` (postgres/postgres)
   * Redis: `localhost:6379`
   * MinIO console: <http://localhost:9001>
4. Apply migrations & seed data inside the backend container:
   ```bash
   docker compose -f infra/docker-compose.yml exec backend npx prisma migrate deploy
   docker compose -f infra/docker-compose.yml exec backend npm run seed
   ```
5. Tear down with `make docker-down`.

## Local (non-Docker) development

*API*
```bash
cd backend
npm install
npm run migrate:dev
npm run start:dev
```

*Frontend*
```bash
cd frontend
npm install
npm run dev
```

Set the following minimum environment variables when running locally:

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nhh?schema=public
export JWT_ACCESS_SECRET=change-me
export JWT_REFRESH_SECRET=change-me
export WEB_ORIGIN=http://localhost:3000
export GOOGLE_DRIVE_MOCK=true
export DATA_ENCRYPTION_KEY=change-this-key
```

## Testing & quality

Run automated checks from the backend directory:

```bash
npm test           # Unit tests & coverage
npm run test:e2e   # End-to-end scenario covering the full handover workflow
npm run lint       # ESLint + Prettier
```

Key test coverage includes:
- Authentication and officer verification logic (`AuthService`)
- RBAC guard enforcement (`RolesGuard`)
- Address redaction rules (`ListingsService`)
- Secure upload handling (`UploadService`)
- Full register → verify → publish → transfer → upload flow (e2e)

## Database schema

Prisma models align with the specification:
- `users` – officer profile, role, hashed service number
- `sessions` – hashed refresh tokens, device metadata
- `listings` – property adverts with policy-based address redaction
- `interests` – officer expressions of interest with status workflow
- `transfers` – handover records and consent artefacts

SQL migration scripts are stored in `backend/prisma/migrations`.

## Seeding

`backend/prisma/seed.ts` provides example ADMIN, MODERATOR, and OFFICER accounts plus a published listing.

## API contract

See [`docs/openapi.yaml`](docs/openapi.yaml) for the full OpenAPI 3.1 definition, including request/response examples and security schemes. The API is entirely private; all routes require JWT Bearer tokens issued by `/auth/login` or `/auth/register`.

## Security highlights

- JWT access (15 minutes) & refresh (7 days) tokens with session revocation
- RBAC guard for OFFICER/MODERATOR/ADMIN roles
- Service numbers stored as Argon2 hashes
- Strict e-mail domain enforcement (`@navy.mil.ng`)
- Policy-based address redaction for non-owners
- Google Drive uploads with optional mocked storage and signed URLs
- Helmet, CSRF, and express rate limiting enabled globally
- Structured audit logging via Winston with rotating file output

## Frontend overview

The Next.js dashboard offers:
- Secure sign-in/registration for officers
- Listing creation & publishing controls (British English copy)
- Interest management and transfer initiation workflows
- Visibility of other published listings with quick interest submission

Environment configuration lives in `frontend/.env.example` (set `NEXT_PUBLIC_API_URL`).
