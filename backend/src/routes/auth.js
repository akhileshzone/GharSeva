import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  publicUser,
} from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email').toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(10, 'Phone must be at least 10 digits')
    .max(15)
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  location: z.string().trim().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const locationSchema = z.object({
  location: z.string().trim().min(2).max(120),
});

router.post('/signup', async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid input',
        details: parsed.error.flatten(),
      });
    }

    const { name, email, phone, password, location } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        location: location || 'Hyderabad, Telangana',
      },
    });

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid input',
      });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Could not log in' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me/location', requireAuth, async (req, res) => {
  try {
    const parsed = locationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { location: parsed.data.location },
    });

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('location update error:', err);
    res.status(500).json({ error: 'Could not update location' });
  }
});

export default router;
