.PHONY: backend-dev frontend-dev migrate seed test lint docker-up docker-down

backend-dev:
cd backend && npm install && npm run start:dev

frontend-dev:
cd frontend && npm install && npm run dev

migrate:
cd backend && npm install && npm run migrate:dev

seed:
cd backend && npm install && npm run seed

test:
cd backend && npm install && npm test

lint:
cd backend && npm install && npm run lint

docker-up:
cd infra && docker compose up --build

docker-down:
cd infra && docker compose down
