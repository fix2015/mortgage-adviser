# AI Mortgage Adviser

## Architecture
- Backend: FastAPI (Python 3.12) at `/backend/`
- Frontend: React + Vite + TypeScript at `/frontend/`
- Infrastructure: Docker Compose at `/infra/`
- CI/CD: GitHub Actions at `.github/workflows/`

## Deployment
- Server: AWS EC2 (same as probooking + accountant-adviser, 34.227.48.162)
- Domain: https://mortgage-advisor.probooking.app/
- Backend port: 8002
- Frontend port: 3003
- Container prefix: mortgage_

## Key Services
- Stripe: £15 consultation, £50 extra questions, £7/month subscription
- OpenAI: GPT-4o for UK mortgage advice
- AWS S3: Document storage (gport bucket, mortgage-adviser/ prefix)
- PostgreSQL: Data storage
- Redis: Caching + Celery broker

## Design System
- Primary: Emerald green (#059669) — trust, stability
- Secondary: Warm gold (#D97706) — premium, aspirational
- All colors in CSS variables in frontend/src/index.css
- Tailwind uses ds-* prefix for design system classes
