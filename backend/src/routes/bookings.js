import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  serviceName: z.string().min(1).max(120),
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
    visitDate: b.visitDate instanceof Date
      ? b.visitDate.toISOString().slice(0, 10)
      : b.visitDate,
    visitTime: b.visitTime,
    paymentMethod: b.paymentMethod,
    amountPaise: b.amountPaise,
    amountDisplay: `₹${(b.amountPaise / 100).toFixed(0)}`,
    paymentStatus: b.paymentStatus,
    status: b.status,
    createdAt: b.createdAt,
  };
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ bookings: bookings.map(serializeBooking) });
  } catch (err) {
    console.error('list bookings error:', err);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

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
    const visitDate = new Date(data.visitDate + 'T12:00:00.000Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(visitDate.getTime())) {
      return res.status(400).json({ error: 'Invalid visit date' });
    }
    if (visitDate < today) {
      return res.status(400).json({ error: 'Visit date cannot be in the past' });
    }

    // Retry on rare bookingCode collision
    let booking = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        booking = await prisma.booking.create({
          data: {
            bookingCode: generateBookingCode(),
            userId: req.user.id,
            serviceId: data.serviceId,
            serviceName: data.serviceName,
            address: data.address,
            city: data.city,
            pincode: data.pincode,
            propertyType: data.propertyType,
            notes: data.notes || null,
            visitDate,
            visitTime: data.visitTime,
            paymentMethod: data.paymentMethod,
            amountPaise: 19900,
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

    res.status(201).json({ booking: serializeBooking(booking) });
  } catch (err) {
    console.error('create booking error:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

export default router;
