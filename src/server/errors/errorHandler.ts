import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export function handleApiError(error: unknown): NextResponse {
  // AppError (Known domain and authorization errors)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code,
    }));

    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details,
        },
      },
      { status: 400 }
    );
  }

  // Prisma unique constraint or foreign key violation
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };
    if (prismaError.code === 'P2002') {
      const target = Array.isArray(prismaError.meta?.target)
        ? (prismaError.meta?.target as string[]).join(', ')
        : 'unique field';
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: `A record with this ${target} already exists.`,
            details: [],
          },
        },
        { status: 409 }
      );
    }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Target record not found in database.',
            details: [],
          },
        },
        { status: 404 }
      );
    }
  }

  // Unhandled internal server error (never leak internal stack trace to client)
  console.error('[Internal Server Error]:', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing the request.',
        details: [],
      },
    },
    { status: 500 }
  );
}
