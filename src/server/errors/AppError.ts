export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: unknown[];

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details: unknown[] = []
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details: unknown[] = []): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message: string, details: unknown[] = []): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthenticated(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static businessRule(message: string, details: unknown[] = []): AppError {
    return new AppError(422, 'BUSINESS_RULE_VIOLATION', message, details);
  }

  static rateLimitExceeded(message = 'Too many requests. Please slow down.'): AppError {
    return new AppError(429, 'RATE_LIMIT_EXCEEDED', message);
  }

  static internal(message = 'An unexpected server error occurred'): AppError {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}
