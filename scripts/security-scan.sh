#!/bin/bash
# Security scan for AI Mortgage Adviser
# Run: bash scripts/security-scan.sh

set -e
echo "========================================="
echo "  Security Scan - AI Mortgage Adviser"
echo "========================================="
echo ""

ERRORS=0

# 1. Check for secrets in codebase
echo "🔍 Scanning for hardcoded secrets..."
SECRETS=$(grep -rEi '(sk_live_|sk_test_|AKIA[0-9A-Z]{16}|whsec_)' --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v '.example' | grep -v '.md' || true)
if [ -n "$SECRETS" ]; then
    echo "❌ Hardcoded secrets found:"
    echo "$SECRETS"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No hardcoded secrets found"
fi

# 2. Check .gitignore
echo ""
echo "🔍 Checking .gitignore..."
for pattern in ".env" "*.pem" "*.key" "node_modules" "__pycache__"; do
    if grep -q "$pattern" .gitignore 2>/dev/null; then
        echo "✅ $pattern is in .gitignore"
    else
        echo "❌ $pattern is NOT in .gitignore"
        ERRORS=$((ERRORS + 1))
    fi
done

# 3. Check Dockerfiles for non-root user
echo ""
echo "🔍 Checking Docker security..."
for df in $(find . -name "Dockerfile" -not -path "*/node_modules/*"); do
    if grep -q "USER" "$df"; then
        echo "✅ $df uses non-root user"
    else
        echo "⚠️ $df may run as root"
    fi
done

# 4. Check for console.log with sensitive data
echo ""
echo "🔍 Checking for sensitive console.log..."
CONSOLE_SECRETS=$(grep -rn 'console.log.*\(.*password\|.*token\|.*secret\|.*key\)' --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules || true)
if [ -n "$CONSOLE_SECRETS" ]; then
    echo "⚠️ Possible sensitive data in console.log:"
    echo "$CONSOLE_SECRETS"
else
    echo "✅ No sensitive console.log found"
fi

# 5. Check for SQL injection risks
echo ""
echo "🔍 Checking for SQL injection risks..."
SQL_INJECT=$(grep -rn 'f".*SELECT\|f".*INSERT\|f".*UPDATE\|f".*DELETE\|\.format.*SELECT' --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v '.pyc' || true)
if [ -n "$SQL_INJECT" ]; then
    echo "⚠️ Possible SQL injection (using f-strings for SQL):"
    echo "$SQL_INJECT"
else
    echo "✅ No SQL injection patterns found"
fi

# 6. Check for .env files in repository
echo ""
echo "🔍 Checking for .env files in repository..."
ENV_FILES=$(find . -name ".env" -o -name ".env.local" -o -name ".env.production" 2>/dev/null | grep -v node_modules || true)
if [ -n "$ENV_FILES" ]; then
    echo "⚠️ .env files found in repository:"
    echo "$ENV_FILES"
else
    echo "✅ No .env files found"
fi

# 7. Check for private keys
echo ""
echo "🔍 Checking for private key files..."
KEY_FILES=$(find . -name "*.pem" -o -name "*.key" -o -name "*.p12" 2>/dev/null | grep -v node_modules || true)
if [ -n "$KEY_FILES" ]; then
    echo "❌ Private key files found:"
    echo "$KEY_FILES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No private key files found"
fi

# 8. Check for TODO security items
echo ""
echo "🔍 Checking for security-related TODOs..."
SECURITY_TODOS=$(grep -rni 'TODO.*security\|FIXME.*security\|HACK.*auth\|TODO.*auth\|TODO.*password\|TODO.*encrypt' --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules || true)
if [ -n "$SECURITY_TODOS" ]; then
    echo "⚠️ Security-related TODOs found:"
    echo "$SECURITY_TODOS"
else
    echo "✅ No security TODOs found"
fi

# 9. Check for debug mode in production configs
echo ""
echo "🔍 Checking for debug mode flags..."
DEBUG_FLAGS=$(grep -rni 'DEBUG\s*=\s*True\|debug:\s*true' --include="*.py" --include="*.ts" --include="*.yml" --include="*.yaml" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v '.example' || true)
if [ -n "$DEBUG_FLAGS" ]; then
    echo "⚠️ Debug mode flags found (verify these are not in production):"
    echo "$DEBUG_FLAGS"
else
    echo "✅ No debug mode flags found"
fi

# 10. Check CORS configuration
echo ""
echo "🔍 Checking CORS configuration..."
CORS_WILDCARD=$(grep -rn "allow_origins.*\*\|Access-Control-Allow-Origin.*\*\|cors.*origin.*\*" --include="*.py" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v '.md' || true)
if [ -n "$CORS_WILDCARD" ]; then
    echo "⚠️ Wildcard CORS origin found (not safe for production):"
    echo "$CORS_WILDCARD"
else
    echo "✅ No wildcard CORS origins found"
fi

echo ""
echo "========================================="
if [ $ERRORS -gt 0 ]; then
    echo "  ❌ Found $ERRORS security issues"
    exit 1
else
    echo "  ✅ All security checks passed"
fi
echo "========================================="
