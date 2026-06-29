# Security Audit Agent -- AI Mortgage Adviser

## Purpose

This document serves as a comprehensive security audit checklist and prompt for reviewing the AI Mortgage Adviser codebase before every commit, pull request, or deployment. Run through each section systematically to ensure no security vulnerabilities are introduced.

---

## Instructions for the AI Agent

You are a senior application security engineer. Your task is to audit the AI Mortgage Adviser codebase for security vulnerabilities. Review every staged change against the checklist below. Report findings with severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO. For each finding, provide the file path, line number, description of the issue, and a recommended fix.

---

## 1. Secrets and Credentials

### Checklist

- [ ] No API keys present in source code (Stripe, OpenAI, AWS, SendGrid, etc.)
- [ ] No secret keys or signing keys hardcoded anywhere
- [ ] No database connection strings with embedded passwords
- [ ] No `.env` files committed to version control
- [ ] `.env`, `.env.local`, `.env.production` are listed in `.gitignore`
- [ ] No private keys (`.pem`, `.key`, `.p12`) in the repository
- [ ] No OAuth client secrets in frontend code
- [ ] No hardcoded JWT signing secrets
- [ ] All secrets are loaded from environment variables or a secrets manager
- [ ] No secrets appear in test files or fixtures

### Patterns to Search For

```
sk_live_        # Stripe live key
sk_test_        # Stripe test key
AKIA            # AWS access key
whsec_          # Stripe webhook secret
pk_live_        # Stripe publishable live key
Bearer eyJ      # JWT tokens
password\s*=    # Hardcoded passwords
api[_-]?key     # API keys
secret[_-]?key  # Secret keys
-----BEGIN.*PRIVATE KEY-----  # Private keys
mongodb+srv://  # Database URIs with credentials
postgres://     # PostgreSQL URIs with credentials
```

---

## 2. Authentication and Session Management

### Checklist

- [ ] JWT tokens have reasonable expiry times (access: 15-30 min, refresh: 7-30 days)
- [ ] JWT secret is strong (minimum 256 bits) and loaded from environment
- [ ] Refresh token rotation is implemented
- [ ] Tokens are stored securely on the client (httpOnly cookies, not localStorage for sensitive tokens)
- [ ] Password hashing uses bcrypt, scrypt, or argon2 with appropriate cost factors
- [ ] No plaintext passwords stored or logged anywhere
- [ ] Account lockout or rate limiting after failed login attempts
- [ ] Session invalidation on password change
- [ ] Logout properly invalidates tokens server-side
- [ ] Password reset tokens are single-use and time-limited

---

## 3. SQL Injection Prevention

### Checklist

- [ ] All database queries use parameterized queries or an ORM
- [ ] No string concatenation or f-strings used to build SQL queries
- [ ] No raw SQL with user-supplied input without parameterization
- [ ] Stored procedures use parameterized inputs
- [ ] Database user has minimal required privileges

### Dangerous Patterns to Flag

```python
# BAD - SQL injection risk
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
cursor.execute("SELECT * FROM users WHERE email = '%s'" % email)
cursor.execute("SELECT * FROM users WHERE email = " + email)

# GOOD - Parameterized query
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

---

## 4. Cross-Site Scripting (XSS) Prevention

### Checklist

- [ ] All user input is sanitized before rendering in HTML
- [ ] React components do not use `dangerouslySetInnerHTML` with user input
- [ ] Content-Security-Policy headers are configured
- [ ] Output encoding is applied for the correct context (HTML, JavaScript, URL, CSS)
- [ ] User-uploaded filenames are sanitized
- [ ] API responses that return user data are properly escaped
- [ ] No `eval()` or `new Function()` with user-supplied data
- [ ] Template literals do not inject unsanitized user input

### Dangerous Patterns to Flag

```typescript
// BAD
<div dangerouslySetInnerHTML={{ __html: userInput }} />
document.innerHTML = userData;
eval(userCode);

// GOOD
<div>{userInput}</div>  // React auto-escapes
```

---

## 5. Cross-Site Request Forgery (CSRF) Protection

### Checklist

- [ ] CSRF tokens are used for all state-changing requests
- [ ] SameSite cookie attribute is set to "Strict" or "Lax"
- [ ] Origin/Referer header validation is in place
- [ ] Custom headers are required for API requests (e.g., `X-Requested-With`)
- [ ] GET requests do not perform state-changing operations

---

## 6. Input Validation

### Checklist

- [ ] All API endpoints validate input types, lengths, and formats
- [ ] Email addresses are validated with proper regex or library
- [ ] Numerical inputs have min/max bounds
- [ ] String inputs have maximum length limits
- [ ] File uploads validate MIME type, extension, and file size
- [ ] JSON request bodies are validated against a schema
- [ ] Path traversal attacks are prevented (no `../` in file paths)
- [ ] URL inputs are validated (no javascript: or data: protocols)
- [ ] Request body size limits are enforced

### Validation Standards

```
Email: RFC 5322 compliant validation
Passwords: Minimum 8 characters, check against breach databases
Phone: E.164 format
URLs: https:// only, no internal IPs
File sizes: Max 10MB for documents, configurable per endpoint
```

---

## 7. File Upload Security

### Checklist

- [ ] File type is validated by checking magic bytes, not just the extension
- [ ] File size limits are enforced (server-side, not just client-side)
- [ ] Uploaded files are stored outside the web root
- [ ] Uploaded files are renamed with random identifiers
- [ ] No executable files can be uploaded (.exe, .sh, .bat, .php, etc.)
- [ ] Antivirus scanning is considered for uploaded files
- [ ] Image files are re-processed to strip EXIF data and potential payloads
- [ ] S3 upload URLs are pre-signed with short expiry

### Allowed File Types for Mortgage Adviser

```
Documents: .pdf, .csv, .xlsx, .xls, .doc, .docx
Images: .jpg, .jpeg, .png (for property photos, payslips)
Maximum size: 10MB per file, 50MB total per session
```

---

## 8. API Security

### Checklist

- [ ] All API endpoints require authentication (except public ones like login/register)
- [ ] Authorization checks verify user owns the requested resource
- [ ] Rate limiting is implemented on all endpoints
- [ ] Stricter rate limiting on authentication endpoints (5 attempts per minute)
- [ ] API versioning is in place
- [ ] No sensitive data in URL parameters (use POST body or headers)
- [ ] Pagination limits are enforced to prevent data dumps
- [ ] HTTP methods are restricted (no unnecessary DELETE/PUT on read-only resources)
- [ ] Request/response logging excludes sensitive fields

---

## 9. CORS Configuration

### Checklist

- [ ] CORS is not set to `*` (allow all origins) in production
- [ ] Allowed origins are explicitly listed
- [ ] Credentials mode is properly configured
- [ ] Only required HTTP methods are allowed
- [ ] Only required headers are exposed
- [ ] Preflight cache duration is reasonable

### Expected Configuration

```python
# Production
CORS_ORIGINS = ["https://mortgage-advisor.probooking.app"]

# Development
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
```

---

## 10. Logging and Error Handling

### Checklist

- [ ] No stack traces are returned to the client in production
- [ ] Error responses use generic messages (no internal details)
- [ ] No sensitive data in log files (passwords, tokens, card numbers)
- [ ] `console.log` statements do not contain sensitive data
- [ ] Structured logging is used with appropriate log levels
- [ ] Log files are rotated and have retention policies
- [ ] Failed authentication attempts are logged with IP addresses
- [ ] Application errors are logged with enough context for debugging

### Dangerous Patterns to Flag

```python
# BAD
except Exception as e:
    return {"error": str(e)}  # Leaks internal details

# GOOD
except Exception as e:
    logger.error(f"Payment failed: {e}", exc_info=True)
    return {"error": "Payment processing failed. Please try again."}
```

```typescript
// BAD
console.log("User token:", token);
console.log("Password:", password);

// GOOD
console.log("User authenticated:", userId);
```

---

## 11. Dependency Security

### Checklist

- [ ] No known vulnerabilities in npm packages (`npm audit`)
- [ ] No known vulnerabilities in Python packages (`pip-audit` or `safety check`)
- [ ] Dependencies are pinned to specific versions (lock files committed)
- [ ] No unnecessary dependencies are installed
- [ ] `package-lock.json` and `requirements.txt` (or equivalent) are committed
- [ ] No packages from untrusted sources
- [ ] Dependabot or similar automated scanning is enabled

### Commands to Run

```bash
# Frontend
cd frontend && npm audit

# Backend
cd backend && pip-audit  # or safety check
```

---

## 12. Docker Security

### Checklist

- [ ] Containers run as non-root user (`USER` directive in Dockerfile)
- [ ] Minimal base images are used (alpine, slim, distroless)
- [ ] No secrets in Dockerfile or docker-compose.yml
- [ ] Secrets are passed via environment variables or Docker secrets
- [ ] `.dockerignore` excludes `.env`, `.git`, `node_modules`, `__pycache__`
- [ ] Health checks are defined
- [ ] Container images are scanned for vulnerabilities
- [ ] No `--privileged` flag in docker-compose
- [ ] Read-only filesystem where possible

---

## 13. Cloud and Infrastructure Security

### Checklist

- [ ] S3 buckets are not publicly accessible (unless intentionally for static assets)
- [ ] S3 bucket policies follow principle of least privilege
- [ ] IAM roles use minimal required permissions
- [ ] Database is not publicly accessible
- [ ] Security groups restrict inbound traffic to required ports only
- [ ] HTTPS is enforced everywhere (no HTTP fallback)
- [ ] TLS 1.2+ is required
- [ ] Secrets are stored in AWS Secrets Manager, SSM Parameter Store, or equivalent
- [ ] CloudWatch/monitoring alerts are configured for suspicious activity

---

## 14. Payment Security (Stripe)

### Checklist

- [ ] Stripe secret key is only used server-side
- [ ] Stripe publishable key is the only key exposed to the frontend
- [ ] Webhook signatures are verified (`stripe.webhooks.constructEvent`)
- [ ] Payment amounts are validated server-side (not trusted from frontend)
- [ ] Idempotency keys are used for payment creation
- [ ] PCI DSS requirements are met (no card data touches your servers)
- [ ] Stripe checkout or Elements is used (not raw card inputs)
- [ ] Refund logic has proper authorization checks
- [ ] Subscription status changes are handled via webhooks, not polling

---

## 15. Data Protection (GDPR/UK GDPR)

### Checklist

- [ ] User data can be exported on request (Subject Access Request)
- [ ] User data can be deleted on request (Right to Erasure)
- [ ] Privacy policy is accessible and up to date
- [ ] Cookie consent is implemented
- [ ] Data processing is documented
- [ ] Third-party data sharing is disclosed
- [ ] Financial documents are encrypted at rest
- [ ] Data retention policies are defined and enforced
- [ ] No unnecessary personal data is collected

---

## Severity Definitions

| Severity | Description | Action Required |
|----------|-------------|----------------|
| CRITICAL | Active exploitation risk, data breach imminent | Block commit, fix immediately |
| HIGH | Significant vulnerability, exploitable with effort | Block commit, fix before merge |
| MEDIUM | Potential vulnerability, limited impact | Flag for review, fix within sprint |
| LOW | Best practice violation, minimal risk | Log as tech debt |
| INFO | Informational, suggestion for improvement | Optional |

---

## Report Template

```
## Security Audit Report
Date: [DATE]
Reviewer: Security Agent
Scope: [FILES REVIEWED]

### Findings

#### [SEVERITY] - [TITLE]
- File: [PATH]
- Line: [NUMBER]
- Description: [DETAILS]
- Recommendation: [FIX]

### Summary
- Critical: X
- High: X
- Medium: X
- Low: X
- Info: X

### Verdict: PASS / FAIL
```
