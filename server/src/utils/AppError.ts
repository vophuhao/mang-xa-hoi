import type { HttpStatusCode } from '@/types';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    code?: string,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);

    // Restore prototype chain
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.isOperational = isOperational;
    if (details !== undefined) {
      this.details = details;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Set the error name
    this.name = this.constructor.name;
  }

  private getDefaultCode(statusCode: HttpStatusCode): string {
    const codeMap: Record<HttpStatusCode, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED', 
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
      200: 'SUCCESS',
      201: 'CREATED',
      204: 'NO_CONTENT',
    };

    return codeMap[statusCode] || 'UNKNOWN_ERROR';
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  // Static factory methods for common errors
  static badRequest(message = 'Bad Request', details?: Record<string, unknown>): AppError {
    return new AppError(400, message, 'BAD_REQUEST', true, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict', details?: Record<string, unknown>): AppError {
    return new AppError(409, message, 'CONFLICT', true, details);
  }

  static validationError(message = 'Validation failed', details?: Record<string, unknown>): AppError {
    return new AppError(422, message, 'VALIDATION_ERROR', true, details);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Internal server error', details?: Record<string, unknown>): AppError {
    return new AppError(500, message, 'INTERNAL_SERVER_ERROR', false, details);
  }
}

export default AppError;
