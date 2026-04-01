import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { config } from '../config/config.js';

const registerSchema = z.object({
  name:     z.string().min(1).max(50),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function issueTokens(res, user) {
  const payload = { id: user._id, email: user.email };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: config.auth.accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: config.auth.refreshTokenExpiry,
  });

  const cookieOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: config.auth.cookieMaxAge });

  return refreshToken;
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(data.password, config.auth.bcryptRounds);
    const user = await User.create({ name: data.name, email: data.email, password: hashed });

    const refreshToken = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const refreshToken = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken) return res.status(401).json({ error: 'Invalid session' });

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) return res.status(401).json({ error: 'Invalid session' });

    const newRefresh = issueTokens(res, user);
    const hashedRefresh = await bcrypt.hash(newRefresh, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch (_) {}
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
}

export async function checkEmail(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });

  const existing = await User.findOne({
    email: email.toLowerCase().trim(),
    _id: { $ne: req.user.id },
  });

  res.json({ available: !existing });
}

const updateProfileSchema = z.object({
  name:  z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
}).refine(d => d.name !== undefined || d.email !== undefined, {
  message: 'At least one of name or email is required',
});

export async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (data.email) {
      const conflict = await User.findOne({
        email: data.email.toLowerCase().trim(),
        _id: { $ne: req.user.id },
      });
      if (conflict) return res.status(409).json({ error: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(data.name && { name: data.name }), ...(data.email && { email: data.email.toLowerCase().trim() }) },
      { new: true }
    );

    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(100),
});

export async function updatePassword(req, res, next) {
  try {
    const data = updatePasswordSchema.parse(req.body);

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(data.newPassword, config.auth.bcryptRounds);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });

    res.json({ ok: true });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}
