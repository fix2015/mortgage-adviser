#!/usr/bin/env bash
set -euo pipefail

DOMAIN="mortgage-advisor.probooking.app"
EMAIL="${CERTBOT_EMAIL:-admin@probooking.app}"
WEBROOT="/var/www/certbot"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

echo "=== SSL Setup for ${DOMAIN} ==="

# Ensure certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Create webroot directory
sudo mkdir -p "${WEBROOT}"

# Copy nginx config if not already in place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "${NGINX_CONF}" ]; then
    echo "Installing nginx config..."
    sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"
fi

# Enable the site
if [ ! -L "${NGINX_ENABLED}" ]; then
    echo "Enabling site..."
    sudo ln -sf "${NGINX_CONF}" "${NGINX_ENABLED}"
fi

# First, set up a temporary HTTP-only config for certificate issuance
TEMP_CONF=$(mktemp)
cat > "${TEMP_CONF}" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
NGINX

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "Certificate already exists. Renewing..."
    sudo certbot renew --cert-name "${DOMAIN}"
else
    echo "Obtaining new certificate..."
    # Use temporary config for initial cert
    sudo cp "${TEMP_CONF}" "${NGINX_CONF}"
    sudo nginx -t && sudo systemctl reload nginx

    sudo certbot certonly \
        --webroot \
        --webroot-path "${WEBROOT}" \
        -d "${DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    # Restore full config with SSL
    sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"
fi

rm -f "${TEMP_CONF}"

# Test and reload nginx
echo "Testing nginx configuration..."
sudo nginx -t

echo "Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "=== SSL setup complete for ${DOMAIN} ==="
echo "Certificate location: /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "Auto-renewal is handled by certbot's systemd timer."
echo "Verify with: sudo certbot renew --dry-run"
