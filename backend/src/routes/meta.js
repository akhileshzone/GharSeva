import { Router } from 'express';
import {
  LOCATIONS,
  TIME_SLOTS,
  PROPERTY_TYPES,
  PAYMENT_METHODS,
  VISIT_FEE_PAISE,
  VISIT_FEE_DISPLAY,
} from '../data/catalog.js';

const router = Router();

/** GET /api/meta — locations, slots, fees for the booking UI */
router.get('/', (_req, res) => {
  res.json({
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    locations: LOCATIONS,
    timeSlots: TIME_SLOTS,
    propertyTypes: PROPERTY_TYPES,
    paymentMethods: PAYMENT_METHODS,
    bookingSteps: [
      { step: 1, key: 'address', title: 'Property Address & Details' },
      { step: 2, key: 'schedule', title: 'Date & Time' },
      { step: 3, key: 'payment', title: 'Payment (₹199)' },
      { step: 4, key: 'confirm', title: 'Confirmation' },
    ],
  });
});

router.get('/locations', (_req, res) => {
  res.json({ locations: LOCATIONS });
});

router.get('/time-slots', (_req, res) => {
  res.json({ timeSlots: TIME_SLOTS });
});

export default router;
