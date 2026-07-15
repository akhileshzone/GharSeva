# Render PostgreSQL setup (Ghar Seva)

Your schema (`User` + `Booking`) is already defined in `backend/prisma/schema.prisma`.  
Render hosts the database; Prisma creates the tables when the API builds.

---

## Step 1 — Create the database

1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and sign in (use the same GitHub as **akhileshzone** if possible).
2. Click **New +** → **PostgreSQL**.
3. Fill in:

| Field | Value |
|--------|--------|
| **Name** | `ghar-seva-db` |
| **Database** | `gharseva` |
| **User** | `gharseva` |
| **Region** | Pick one close to you (e.g. Singapore / Oregon) |
| **Plan** | **Free** if shown, otherwise **Basic/Starter** (cheapest paid) |

4. Click **Create Database**.
5. Wait until status is **Available**.

### Copy the connection string

On the database page → **Info** / **Connections**:

- **Internal Database URL** — use this for the **Render web service** (API on Render).
- **External Database URL** — use this only if you connect from your laptop.

It looks like:

```text
postgresql://gharseva:xxxxx@dpg-xxxxx-a/gharseva
```

For Prisma/Node on Render, prefer a URL that ends with:

```text
?sslmode=require
```

(If Render’s URL doesn’t include it, append `?sslmode=require`.)

---

## Step 2 — Create the API service (uses the DB)

The database alone does not run your app. Create a **Web Service** that talks to it.

1. **New +** → **Web Service**.
2. Connect GitHub → select **`akhileshzone/GharSeva`**.
3. Settings:

| Field | Value |
|--------|--------|
| **Name** | `ghar-seva-api` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push` |
| **Start Command** | `npm start` |
| **Instance type** | Free |

4. **Environment Variables** → Add:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Paste **Internal Database URL** from the Postgres page (add `?sslmode=require` if missing) |
| `JWT_SECRET` | Any long random string, e.g. run in PowerShell: `[Convert]::ToBase64String((1..48\|%{Get-Random -Max 256}) -as [byte[]])` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `*` for first test, later your Netlify URL |

**Easier linking:** On the web service → **Environment** → **Add from database** / **Link database** → choose `ghar-seva-db` → maps `DATABASE_URL` automatically.

5. Click **Create Web Service** and wait for the first deploy (green **Live**).

### Confirm DB tables exist

Build log should show Prisma applying schema (no fatal errors).

Then open:

```text
https://YOUR-API-NAME.onrender.com/health
```

Expected:

```json
{ "ok": true, "service": "ghar-seva-api", "db": "up" }
```

If `"db": "down"`, `DATABASE_URL` is wrong or the DB is still starting.

---

## Step 3 — What gets created in the database

`npx prisma db push` creates:

- **User** — name, email, phone, password hash, location  
- **Booking** — service, address, visit date/time, payment, booking code  

You can inspect later with:

```bash
cd backend
# set DATABASE_URL to External URL from Render
npx prisma studio
```

---

## Optional — Blueprint (DB + API together)

1. Dashboard → **New +** → **Blueprint**.
2. Select repo **`akhileshzone/GharSeva`**.
3. Render reads root `render.yaml` and creates:
   - Postgres `ghar-seva-db`
   - Web service `ghar-seva-api` with `DATABASE_URL` linked  
4. After deploy, set `CORS_ORIGINS` on the web service.

---

## Common issues

| Problem | Fix |
|---------|-----|
| Free Postgres not available | Choose **Starter/Basic** paid plan |
| Build fails on `prisma` | Ensure latest code is pushed (`prisma` is in `dependencies`) |
| Health `db: down` | Use **Internal** URL when API is on Render; check SSL |
| Cold start (Free web) | First request after idle can take 30–60s |

---

## After DB + API work

Deploy frontend on **Netlify** and set:

- Netlify env: `API_BASE_URL` = `https://YOUR-API-NAME.onrender.com`
- Render env: `CORS_ORIGINS` = `https://YOUR-SITE.netlify.app`
