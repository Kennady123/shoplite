# ShopLite — Docker + AWS Deployment Guide

## 1. What was fixed for the frontend ↔ backend connection / CORS

**Problem:** the frontend hardcoded `http://localhost:8000/api` in 4 files
(`useProducts.js`, `usePayment.js`, `AdminDashboard.jsx`, `AdminLoginModal.jsx`),
and the backend hardcoded its CORS allow-list to `localhost:5173` /
`localhost:3000`. That works on your laptop but breaks the moment the
frontend is served from an EC2 IP or domain.

**Fix applied:**

- All 4 frontend files now read `import.meta.env.VITE_API_URL`, falling back
  to `http://localhost:8000/api` for local dev. This value is **baked into
  the JS bundle at build time** (Vite env vars are compile-time, not runtime).
- The backend's `main.py` now reads `CORS_ORIGINS` (comma-separated) from the
  environment instead of a hardcoded list, defaulting to the local dev
  origins.
- `requirements.txt` was missing `sqlalchemy`, `pymysql`, `python-dotenv`,
  `python-jose`, and `razorpay` — added them (the app would not have started
  in a clean container without these).

So at deploy time you set two values:

| Variable | Used by | When | Must be |
|---|---|---|---|
| `VITE_API_URL` | frontend | build time | a URL the **browser** can reach (EC2 public IP/domain + `:8000/api`) |
| `CORS_ORIGINS` | backend | runtime | the origin the **frontend** is served from (EC2 public IP/domain, no path) |

---

## 2. Project layout

```
.
├── docker-compose.yml
├── .env.example              # compose-level vars (VITE_API_URL, CORS_ORIGINS)
├── backend/
│   ├── Dockerfile
│   ├── .env                  # your real secrets (Razorpay keys, DB URL) — DO NOT COMMIT
│   ├── .env.example
│   ├── requirements.txt
│   ├── main.py
│   ├── database.py
│   └── app/...
└── frontend/
    ├── Dockerfile            # multi-stage: node build -> nginx serve
    ├── nginx.conf
    ├── .env.example
    └── src/...
```

---

## 3. Run it locally first (sanity check)

```bash
cd shoplite

# 1. backend/.env already has your dev Razorpay test keys + DB URL.
#    Add CORS_ORIGINS for local docker testing:
echo "CORS_ORIGINS=http://localhost" >> backend/.env

# 2. set the build-time API URL for the frontend
echo "VITE_API_URL=http://localhost:8000/api" > .env

# 3. build & run both containers
docker compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:8000 (docs at `/docs`)

If products load and "Add to Cart" → checkout works without CORS errors in
the browser console, you're good to deploy.

---

## 4. Deploying to AWS with Docker

The simplest path for a small project like this is a **single EC2 instance**
running both containers via `docker compose`. (For production-grade scaling
later, you'd move to ECS/Fargate — same images work there, just orchestrated
differently.)

### Step 1 — Launch an EC2 instance

1. AWS Console → EC2 → **Launch instance**.
2. Choose **Ubuntu 24.04 LTS** (or Amazon Linux 2023).
3. Instance type: `t3.small` is plenty for this app (`t3.micro` works too if
   it's low traffic / free tier).
4. **Key pair**: create or select one (you need this to SSH in).
5. **Security group** — allow inbound:
   - `22` (SSH) from your IP
   - `80` (HTTP) from anywhere — frontend
   - `8000` (HTTP) from anywhere — backend API
   - (optional) `443` if you'll add HTTPS later
6. Launch, then note the instance's **Public IPv4 address**.

### Step 2 — Install Docker on the instance

SSH in:

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Install Docker + Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Step 3 — Get your project onto the instance

Easiest: zip/transfer it, or push to a Git repo and clone it.

```bash
# from your local machine
scp -i your-key.pem -r ./shoplite ubuntu@<EC2_PUBLIC_IP>:~/shoplite
```

or, if it's in GitHub:

```bash
git clone https://github.com/you/shoplite.git
cd shoplite
```

### Step 4 — Set the environment values for THIS server

On the EC2 instance:

```bash
cd ~/shoplite

# build-time API URL — replace with your EC2 public IP (or domain)
echo "VITE_API_URL=http://<EC2_PUBLIC_IP>:8000/api" > .env

# CORS — the origin the frontend will be served from
echo "CORS_ORIGINS=http://<EC2_PUBLIC_IP>" >> backend/.env
```

Make sure `backend/.env` also still has your real `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, and `DATABASE_URL` (these were already in the file —
just don't delete them).

### Step 5 — Build and run

```bash
docker compose up --build -d
```

Check status / logs:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

### Step 6 — Test it

- Open `http://<EC2_PUBLIC_IP>` → ShopLite storefront should load.
- Open `http://<EC2_PUBLIC_IP>:8000/docs` → FastAPI Swagger UI.
- Add a product to cart and try checkout — no CORS errors should appear in
  the browser dev console (F12 → Console/Network).

---

## 5. Updating the app later

```bash
cd ~/shoplite
git pull                     # or re-upload changed files
docker compose up --build -d # rebuilds only changed images
```

To stop everything:

```bash
docker compose down
```

---

## 6. Common pitfalls

- **Changed `VITE_API_URL` but frontend still calls localhost** — Vite env
  vars are baked in at *build* time. You must rebuild the frontend image
  (`docker compose build frontend`) after changing it, a restart alone won't
  pick it up.
- **CORS errors in browser console** — `CORS_ORIGINS` in `backend/.env` must
  exactly match the scheme + host (+ port if non-standard) the frontend is
  served from. `http://1.2.3.4` ≠ `http://1.2.3.4:80` ≠ `https://1.2.3.4`.
- **Database connection fails** — your `DATABASE_URL` points to an external
  Aiven MySQL instance. Make sure that database's firewall/allowlist permits
  connections from your EC2 instance's public IP.
- **Port 8000 not reachable** — double-check the EC2 security group inbound
  rules allow TCP 8000 (and 80) from `0.0.0.0/0` or your needed range.
- **Want HTTPS** — put the EC2 instance behind an AWS Application Load
  Balancer with an ACM certificate, or run Caddy/Certbot + nginx on the
  instance itself for a free Let's Encrypt cert. Then update `VITE_API_URL`
  and `CORS_ORIGINS` to use `https://`.

---

## 7. Razorpay note

`backend/.env` currently has **Razorpay test mode keys** (`rzp_test_...`).
That's fine for development/demo. For real payments, swap these for your
live keys (`rzp_live_...`) before going to production, and never commit
`.env` to a public repo.
