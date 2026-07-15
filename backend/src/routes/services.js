import { Router } from 'express';
import { SERVICES, getServiceById } from '../data/catalog.js';

const router = Router();

/** GET /api/services — list all bookable services */
router.get('/', (_req, res) => {
  res.json({
    count: SERVICES.length,
    visitFeeDisplay: '₹199',
    services: SERVICES,
  });
});

/** GET /api/services/:id — single service */
router.get('/:id', (req, res) => {
  const service = getServiceById(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json({ service });
});

export default router;
