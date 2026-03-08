import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AuthError, NotFoundError } from '../utils/errors.js';
import type { SubscriptionTier } from '@prisma/client';

interface SafeUser {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResult {
  token: string;
  user: SafeUser;
}

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  subscriptionTier: true,
  createdAt: true,
  updatedAt: true,
} as const;

const SALT_ROUNDS = 10;

function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError('A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: safeUserSelect,
  });

  const token = generateToken(user.id);
  return { token, user };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid email or password');
  }

  const token = generateToken(user.id);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}
