import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getServiceById,
  TIME_SLOTS,
  VISIT_FEE_PAISE,
} from '../data/catalog.js';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  serviceName: z.string().min(1).max(120).optional(),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  propertyType: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  visitTime: z.string().trim().min(1).max(40),
  paymentMethod: z.enum(['upi', 'card', 'netbanking']),
});

function generateBookingCode() {
  const part = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GS-${part}`;
}

function serializeBooking(b) {
  return {
    id: b.id,
    bookingCode: b.bookingCode,
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    address: b.address,
    city: b.city,
    pincode: b.pincode,
    propertyType: b.propertyType,
    notes: b.notes,
    visitDate:
      b.visitDate instanceof Date
        ? b.visitDate.toISOString().slice(0, 10)
        : b.visitDate,
    visitTime: b.visitTime,
    paymentMethod: b.paymentMethod,
    amountPaise: b.amountPaise,
    amountDisplay: `₹${(b.amountPaise / 100).toFixed(0)}`,
    paymentStatus: b.paymentStatus,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

router.use(requireAuth);

/** GET /api/bookings — list my bookings */
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const where = { userId: req.user.id };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      count: bookings.length,
      bookings: bookings.map(serializeBooking),
    });
  } catch (err) {
    console.error('list bookings error:', err);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

/** GET /api/bookings/code/:code — lookup by booking code */
router.get('/code/:code', async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: req.params.code.toUpperCase(),
        userId: req.user.id,
      },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ booking: serializeBooking(booking) });
  } catch (err) {
    console.error('get booking by code error:', err);
    res.status(500).json({ error: 'Could not load booking' });
  }
});

/** GET /api/bookings/:id */
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ booking: serializeBooking(booking) });
  } catch (err) {
    console.error('get booking error:', err);
    res.status(500).json({ error: 'Could not load booking' });
  }
});

/** POST /api/bookings — create booking after ₹199 payment UI */
router.post('/', async (req, res) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid booking data',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const catalogService = getServiceById(data.serviceId);
    const serviceName =
      data.serviceName || catalogService?.name || data.serviceId;

    if (!TIME_SLOTS.includes(data.visitTime)) {
      return res.status(400).json({
        error: `Invalid time slot. Use one of: ${TIME_SLOTS.join(', ')}`,
      });
    }

    const visitDate = new Date(data.visitDate + 'T12:00:00.000Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(visitDate.getTime())) {
      return res.status(400).json({ error: 'Invalid visit date' });
    }
    if (visitDate < today) {
      return res.status(400).json({ error: 'Visit date cannot be in the past' });
    }

    let booking = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        booking = await prisma.booking.create({
          data: {
            bookingCode: generateBookingCode(),
            userId: req.user.id,
            serviceId: data.serviceId,
            serviceName,
            address: data.address,
            city: data.city,
            pincode: data.pincode,
            propertyType: data.propertyType,
            notes: data.notes || null,
            visitDate,
            visitTime: data.visitTime,
            paymentMethod: data.paymentMethod,
            amountPaise: VISIT_FEE_PAISE,
            paymentStatus: 'paid',
            status: 'confirmed',
          },
        });
        break;
      } catch (e) {
        if (e.code === 'P2002') continue;
        throw e;
      }
    }

    if (!booking) {
      return res.status(500).json({ error: 'Could not generate booking code' });
    }

    res.status(201).json({
      message: 'Booking confirmed',
      booking: serializeBooking(booking),
    });
  } catch (err) {
    console.error('create booking error:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

/** PATCH /api/bookings/:id/cancel */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const existing = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (existing.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    const booking = await prisma.booking.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    });

    res.json({
      message: 'Booking cancelled',
      booking: serializeBooking(booking),
    });
  } catch (err) {
    console.error('cancel booking error:', err);
    res.status(500).json({ error: 'Could not cancel booking' });
  }
});

export default router;
