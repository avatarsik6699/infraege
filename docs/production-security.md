# Production Security Minimal v2

This project keeps host security lightweight and auditable: hardened SSH, UFW, Docker log rotation, Nginx rate limits, and one host intrusion-blocking tool.

## Host Baseline

Run these steps before exposing the VPS:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo adduser deploy
sudo usermod -aG sudo,docker deploy
```

Harden SSH in `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
```

Reload SSH only after confirming a second session can log in with the deploy key:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

## UFW

Allow only SSH, HTTP, and HTTPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

## fail2ban

Use `ops/fail2ban/jail.local.template` as the production starting point:

```bash
sudo apt-get install -y fail2ban
sudo cp ops/fail2ban/jail.local.template /etc/fail2ban/jail.local
sudo sed -i 's#REPLACE_WITH_ADMIN_IP#your.admin.ip.address#' /etc/fail2ban/jail.local
sudo sed -i 's#/opt/template-app#/opt/my-project#g' /etc/fail2ban/jail.local
sudo systemctl enable --now fail2ban
sudo fail2ban-client status
```

Production Nginx writes fail2ban-readable logs to `./var/nginx-logs`, mounted into the nginx container as `/var/log/nginx`. It also keeps stdout/stderr logging so `docker compose logs nginx` remains useful.

## sshguard Alternative

If the VPS only needs SSH protection and you prefer a smaller daemon, use `sshguard` instead of fail2ban:

```bash
sudo apt-get install -y sshguard
sudo cp ops/sshguard/sshguard.conf.template /etc/sshguard/sshguard.conf
sudo install -m 644 /dev/null /etc/sshguard/whitelist
echo "your.admin.ip.address" | sudo tee -a /etc/sshguard/whitelist
sudo systemctl enable --now sshguard
```

Do not run both fail2ban and sshguard for SSH bans unless you intentionally want two independent blockers.

## Nginx Rate Limits

`nginx/nginx.conf` defines:

- `api_per_ip`: general `/api/` limit;
- `auth_per_ip`: stricter `/api/v1/public/auth/login` and `/api/v1/public/auth/register` limit;
- HTTP `429` for rate-limited requests;
- CSP as `Content-Security-Policy-Report-Only`.

Keep CSP report-only until third-party scripts, analytics, fonts, payments, and React Router hydration are tested against a blocking policy.

## Monitoring Access

Gatus binds to `127.0.0.1` by default. Prefer SSH tunnel access. If browser access is required, use `ops/nginx/gatus-basic-auth.conf` with HTTPS, Basic Auth, and rate limiting.
