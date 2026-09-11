import { prisma } from '../db';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken, TokenPayload } from '../auth/jwt';
import { AppError } from '../errors/AppError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { UserRole } from '@prisma/client';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone: string | null;
    createdAt: Date;
  };
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists.');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      phone: input.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = signToken(payload);

  return { user, token };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw AppError.unauthenticated('Invalid email or password.');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw AppError.unauthenticated('Invalid email or password.');
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = signToken(payload);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      repairerProfile: {
        select: {
          id: true,
          businessName: true,
          verificationStatus: true,
          rating: true,
          totalJobs: true,
        },
      },
    },
  });

  if (!user) {
    throw AppError.notFound('User');
  }

  return user;
}
