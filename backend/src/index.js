import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import servicesRoutes from './routes/services.js';
import metaRoutes from './routes/meta.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 4000;
const APP_NAME = 'Ghar Seva API';
const APP_VERSION = '1.1.0';

const defaultOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
];

const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (/^https:\/\/[\w-]+\.netlify\.app$/.test(origin)) {
        return callback(null, true);
      }
      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Root — fixes "Cannot GET /" and documents the API */
app.get('/', (_req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    status: 'running',
    docs: '/api',
    health: '/health',
    endpoints: {
      health: 'GET /health',
      apiIndex: 'GET /api',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      updateProfile: 'PATCH /api/auth/me',
      updateLocation: 'PATCH /api/auth/me/location',
      logout: 'POST /api/auth/logout',
      services: 'GET /api/services',
      serviceById: 'GET /api/services/:id',
      meta: 'GET /api/meta',
      listBookings: 'GET /api/bookings',
      createBooking: 'POST /api/bookings',
      getBooking: 'GET /api/bookings/:id',
      getBookingByCode: 'GET /api/bookings/code/:code',
      cancelBooking: 'PATCH /api/bookings/:id/cancel',
    },
    auth: 'Send header: Authorization: Bearer <token>',
  });
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: 'ghar-seva-api',
      version: APP_VERSION,
      db: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      ok: false,
      service: 'ghar-seva-api',
      version: APP_VERSION,
      db: 'down',
      timestamp: new Date().toISOString(),
    });
  }
});

/** API index */
app.get('/api', (_req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    basePath: '/api',
    groups: {
      auth: {
        'POST /api/auth/signup': { body: { name: 'string', email: 'string', phone: 'string?', password: 'string', location: 'string?' }, auth: false },
        'POST /api/auth/login': { body: { email: 'string', password: 'string' }, auth: false },
        'GET /api/auth/me': { auth: true },
        'PATCH /api/auth/me': { body: { name: 'string?', phone: 'string?', location: 'string?' }, auth: true },
        'PATCH /api/auth/me/location': { body: { location: 'string' }, auth: true },
        'POST /api/auth/logout': { auth: true },
      },
      catalog: {
        'GET /api/services': { auth: false },
        'GET /api/services/:id': { auth: false },
        'GET /api/meta': { auth: false, note: 'locations, time slots, property types, payment methods' },
      },
      bookings: {
        'GET /api/bookings': { auth: true, query: { status: 'confirmed|cancelled?' } },
        'POST /api/bookings': {
          auth: true,
          body: {
            serviceId: 'string',
            serviceName: 'string?',
            address: 'string',
            city: 'string',
            pincode: '6 digits',
            propertyType: 'string',
            notes: 'string?',
            visitDate: 'YYYY-MM-DD',
            visitTime: 'e.g. 10:00 AM',
            paymentMethod: 'upi|card|netbanking',
          },
        },
        'GET /api/bookings/:id': { auth: true },
        'GET /api/bookings/code/:code': { auth: true },
        'PATCH /api/bookings/:id/cancel': { auth: true },
      },
    },
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    hint: 'See GET / or GET /api for available endpoints',
  });
});

app.use((err, _req, res, _next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} v${APP_VERSION} listening on port ${PORT}`);
  console.log(`CORS origins: ${allowedOrigins.join(', ') || '(defaults)'}`);
});
