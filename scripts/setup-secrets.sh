#!/bin/bash
# Setup script for AI Mortgage Adviser GitHub secrets and environment
# Run: bash scripts/setup-secrets.sh
#
# Prerequisites:
# - gh CLI authenticated
# - Access to AWS credentials (gport profile)
# - Stripe account with API keys
# - OpenAI API key

set -e
REPO="fix2015/mortgage-adviser"

echo "========================================="
echo "  AI Mortgage Adviser - Setup Secrets"
echo "========================================="
echo ""

# ── 1. Generate random secrets ────────────────────────────────
APP_SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
ADMIN_PASSWORD=$(openssl rand -hex 12)

# ── 2. Collect required keys from user ────────────────────────
echo "Enter your Stripe SECRET key (sk_live_... or sk_test_...):"
read -r STRIPE_SECRET_KEY
echo ""

echo "Enter your Stripe PUBLISHABLE key (pk_live_... or pk_test_...):"
read -r STRIPE_PUBLISHABLE_KEY
echo ""

echo "Enter your Stripe WEBHOOK secret (whsec_...):"
read -r STRIPE_WEBHOOK_SECRET
echo ""

echo "Enter your OpenAI API key (sk-...):"
read -r OPENAI_API_KEY
echo ""

# Get AWS credentials from gport profile
AWS_KEY=$(aws configure get aws_access_key_id --profile gport 2>/dev/null || echo "")
AWS_SECRET=$(aws configure get aws_secret_access_key --profile gport 2>/dev/null || echo "")

if [ -z "$AWS_KEY" ]; then
    echo "Enter your AWS Access Key ID:"
    read -r AWS_KEY
    echo ""
    echo "Enter your AWS Secret Access Key:"
    read -r AWS_SECRET
    echo ""
fi

# ── 3. Create backend .env ────────────────────────────────────
BACKEND_ENV="APP_ENV=production
APP_SECRET_KEY=${APP_SECRET_KEY}
APP_DEBUG=false
APP_ALLOWED_ORIGINS=https://mortgage-advisor.probooking.app

DATABASE_URL=postgresql://mortgage_user:${POSTGRES_PASSWORD}@postgres:5432/mortgage_db
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_CONSULTATION_PRICE=1500
STRIPE_EXTRA_QUESTIONS_PRICE=5000
STRIPE_SUBSCRIPTION_PRICE=700

OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_MODEL=gpt-4o

AWS_ACCESS_KEY_ID=${AWS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET}
AWS_S3_BUCKET=gport
AWS_S3_REGION=eu-central-1
AWS_S3_PREFIX=mortgage-adviser

FIRST_ADMIN_EMAIL=admin@mortgage-advisor.probooking.app
FIRST_ADMIN_PASSWORD=${ADMIN_PASSWORD}
MAX_FREE_QUESTIONS=50"

# ── 4. Create infra .env ──────────────────────────────────────
INFRA_ENV="POSTGRES_USER=mortgage_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=mortgage_db
REDIS_PASSWORD=${REDIS_PASSWORD}"

# ── 5. Encode and set GitHub secrets ──────────────────────────
echo ""
echo "Setting GitHub secrets..."

BACKEND_ENV_B64=$(echo "$BACKEND_ENV" | base64)
INFRA_ENV_B64=$(echo "$INFRA_ENV" | base64)

gh secret set MORTGAGE_BACKEND_ENV --repo "$REPO" --body "$BACKEND_ENV_B64"
echo "  ✅ MORTGAGE_BACKEND_ENV set"

gh secret set MORTGAGE_INFRA_ENV --repo "$REPO" --body "$INFRA_ENV_B64"
echo "  ✅ MORTGAGE_INFRA_ENV set"

gh secret set VITE_STRIPE_PUBLISHABLE_KEY --repo "$REPO" --body "$STRIPE_PUBLISHABLE_KEY"
echo "  ✅ VITE_STRIPE_PUBLISHABLE_KEY set"

# ── 6. Copy EC2 secrets from probooking ───────────────────────
echo ""
echo "Copying EC2 secrets from prof-booking repo..."

# EC2 secrets are shared between projects (same server)
EC2_HOST=$(gh secret list --repo fix2015/prof-booking --json name 2>/dev/null | grep -c EC2_HOST || echo "0")
if [ "$EC2_HOST" != "0" ]; then
    echo "  ℹ️  EC2 secrets exist in prof-booking but can't be read via API."
    echo "  You need to manually set these in the mortgage-adviser repo:"
    echo "    - EC2_HOST"
    echo "    - EC2_USER"
    echo "    - EC2_SSH_PRIVATE_KEY"
    echo ""
    echo "  Run these commands with your values:"
    echo "    gh secret set EC2_HOST --repo $REPO --body \"34.227.48.162\""
    echo "    gh secret set EC2_USER --repo $REPO --body \"ubuntu\""
    echo "    gh secret set EC2_SSH_PRIVATE_KEY --repo $REPO < <(cat ~/.ssh/service.pem | base64)"
fi

# ── 7. Save local .env for development ───────────────────────
echo ""
echo "$BACKEND_ENV" > "$(dirname "$0")/../backend/.env"
echo "  ✅ backend/.env created (local development)"

echo "$INFRA_ENV" > "$(dirname "$0")/../infra/.env"
echo "  ✅ infra/.env created (local development)"

echo ""
echo "========================================="
echo "  ✅ Setup complete!"
echo ""
echo "  Admin credentials:"
echo "    Email: admin@mortgage-advisor.probooking.app"
echo "    Password: ${ADMIN_PASSWORD}"
echo ""
echo "  Next steps:"
echo "    1. Set EC2 secrets (see commands above)"
echo "    2. Push to main branch to trigger CI/CD"
echo "    3. SSH to EC2 and run infra/setup-ssl.sh"
echo "========================================="
