# Deploying to AWS EC2

A raw VM deployment — you're responsible for the OS, Docker, TLS, and monitoring yourself (or wire in CloudWatch/an ALB for some of that). Use this when you specifically need EC2 (existing AWS footprint, VPC peering with other AWS resources, etc.); for less operational overhead, see [Render](render.md)/[Railway](railway.md)/[DigitalOcean](digitalocean.md) instead.

## Setup

1. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu LTS; `t3.small` or larger — the backend alone is fine on a small instance, but running `mongo`+`redis` containers alongside it on the same box needs more headroom).
2. **Security Group**: allow inbound `22` (SSH, ideally restricted to your IP), `80`/`443` (public, for the reverse proxy). Do **not** open `4000`, `27017`, or `6379` to `0.0.0.0/0` — those should only be reachable from the reverse proxy/localhost.
3. SSH in, install Docker + Compose:
   ```bash
   sudo dnf install -y docker    # Amazon Linux; use apt-get on Ubuntu
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER   # log out/in after this
   DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
   mkdir -p $DOCKER_CONFIG/cli-plugins
   curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
   chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
   ```
4. Clone the repo, `cp backend/.env.production.example backend/.env.production` and fill in real values. Prefer **MongoDB Atlas** and **AWS ElastiCache/MemoryDB (Redis)** over self-hosting either on the same instance as the app, unless this is a small/single-box deployment.
5. `docker compose -f docker-compose.prod.yml up --build -d` (drop the `mongo`/`redis` services from that file first if using managed equivalents).
6. Install nginx or Caddy for TLS termination in front of port `4000` (Caddy's automatic HTTPS is the least setup if you own a domain pointed at the instance's Elastic IP).
7. One-time setup: `docker compose -f docker-compose.prod.yml exec backend npm run migrate && npm run seed`.

## Production hardening on EC2 specifically

- Attach an **Elastic IP** so the public address survives an instance stop/start.
- Put the instance behind an **Application Load Balancer** if you need multiple instances/zero-downtime deploys — point its health check at `/health` (liveness) or `/health/ready` (only route traffic once the DB is reachable).
- Use **Systems Manager Parameter Store** or **Secrets Manager** for the real secrets instead of a plain `.env.production` file on disk, if your org's security posture requires it — inject them into the container at startup via your deploy tooling rather than committing them anywhere.
- Enable automatic OS security updates (`dnf-automatic` / `unattended-upgrades`) — this is a raw VM, so nothing else patches it for you.
- CloudWatch Agent can tail the container's JSON logs (`docker logs`) for centralized log search, and scrape `GET /metrics` via the CloudWatch Prometheus integration if you want metrics there instead of a self-hosted Prometheus.
