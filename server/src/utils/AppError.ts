import { AppErrorCode } from "@/constants/appErrorCode";
import type { HttpStatusCode } from "@/constants/http";

/**
 * Custom Application Error class for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    code: AppErrorCode,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);

    // Restore prototype chain
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code;
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

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }

  // Static factory methods for common errors
  static badRequest(
    message = "Bad Request",
    code = AppErrorCode.VALIDATION_ERROR,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(400, message, code, true, details);
  }

  static unauthorized(message = "Unauthorized", code = AppErrorCode.INVALID_CREDENTIALS): AppError {
    return new AppError(401, message, code);
  }

  static forbidden(message = "Forbidden", code = AppErrorCode.INSUFFICIENT_PERMISSIONS): AppError {
    return new AppError(403, message, code);
  }

  static notFound(
    message = "Resource not found",
    code = AppErrorCode.RESOURCE_NOT_FOUND
  ): AppError {
    return new AppError(404, message, code);
  }

  static conflict(
    message = "Conflict",
    code = AppErrorCode.RESOURCE_CONFLICT,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(409, message, code, true, details);
  }

  static validationError(
    message = "Validation failed",
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(422, message, AppErrorCode.VALIDATION_ERROR, true, details);
  }

  static tooManyRequests(
    message = "Too many requests",
    code = AppErrorCode.TOO_MANY_REQUESTS
  ): AppError {
    return new AppError(429, message, code);
  }

  static internal(
    message = "Internal server error",
    code = AppErrorCode.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(500, message, code, false, details);
  }

  // Specific authentication errors
  static invalidToken(message = "Invalid token"): AppError {
    return new AppError(401, message, AppErrorCode.INVALID_ACCESS_TOKEN);
  }

  static expiredToken(message = "Token expired"): AppError {
    return new AppError(401, message, AppErrorCode.TOKEN_EXPIRED);
  }

  static emailNotVerified(message = "Email not verified"): AppError {
    return new AppError(401, message, AppErrorCode.EMAIL_NOT_VERIFIED);
  }

  // Specific resource errors
  static resourceExists(message = "Resource already exists"): AppError {
    return new AppError(409, message, AppErrorCode.RESOURCE_ALREADY_EXISTS);
  }

  static databaseError(message = "Database operation failed"): AppError {
    return new AppError(500, message, AppErrorCode.DATABASE_ERROR, false);
  }
}

export default AppError;
