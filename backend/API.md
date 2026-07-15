# Ghar Seva API Reference

**Base URL (production):** `https://YOUR-API.onrender.com`  
**Base URL (local):** `http://localhost:4000`

All JSON. Auth uses:

```http
Authorization: Bearer <jwt_token>
```

---

## Quick checks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | API overview (no more `Cannot GET /`) |
| GET | `/health` | No | `{ ok, db: "up"\|"down" }` |
| GET | `/api` | No | Full endpoint map |

---

## Auth — `/api/auth`

### Sign up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "9876543210",
  "password": "secret12",
  "location": "Hyderabad, Telangana"
}
```
**201** → `{ token, user }`

### Log in
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "priya@example.com", "password": "secret12" }
```
**200** → `{ token, user }`

### Current user
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Update profile
```http
PATCH /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Priya S", "phone": "9876543210", "location": "Bengaluru, Karnataka" }
```

### Update location only
```http
PATCH /api/auth/me/location
Authorization: Bearer <token>
Content-Type: application/json

{ "location": "Mumbai, Maharashtra" }
```

### Logout (client should delete token)
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## Services (public) — `/api/services`

```http
GET /api/services
GET /api/services/plumbing
```

---

## Meta (public) — `/api/meta`

Locations, time slots, property types, payment methods, visit fee.

```http
GET /api/meta
GET /api/meta/locations
GET /api/meta/time-slots
```

---

## Bookings (auth required) — `/api/bookings`

### List my bookings
```http
GET /api/bookings
GET /api/bookings?status=confirmed
Authorization: Bearer <token>
```

### Create booking (₹199 visit)
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "plumbing",
  "serviceName": "Plumbing Services",
  "address": "12 MG Road, Near Metro",
  "city": "Hyderabad",
  "pincode": "500001",
  "propertyType": "Apartment / Flat",
  "notes": "Leak near bathroom",
  "visitDate": "2026-07-20",
  "visitTime": "10:00 AM",
  "paymentMethod": "upi"
}
```
**201** → `{ booking }` with `bookingCode` like `GS-A1B2C3`

### Get one
```http
GET /api/bookings/:id
GET /api/bookings/code/GS-A1B2C3
Authorization: Bearer <token>
```

### Cancel
```http
PATCH /api/bookings/:id/cancel
Authorization: Bearer <token>
```

---

## Example flow (curl)

```bash
BASE=https://YOUR-API.onrender.com

# 1. Signup
curl -s -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"9876543210","password":"secret12"}'

# Save TOKEN from response, then:

# 2. Services
curl -s $BASE/api/services

# 3. Book
curl -s -X POST $BASE/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"serviceId":"plumbing","address":"12 MG Road","city":"Hyderabad","pincode":"500001","propertyType":"Villa","visitDate":"2026-07-25","visitTime":"10:00 AM","paymentMethod":"upi"}'

# 4. List
curl -s $BASE/api/bookings -H "Authorization: Bearer $TOKEN"
```

---

## Frontend wiring

| Netlify env | Value |
|-------------|--------|
| `API_BASE_URL` | `https://YOUR-API.onrender.com` |

| Render env | Value |
|------------|--------|
| `DATABASE_URL` | From Postgres |
| `JWT_SECRET` | Long secret |
| `CORS_ORIGINS` | Your Netlify URL (or `*`) |
| `NODE_ENV` | `production` |

Frontend client: `frontend/js/api.js`
