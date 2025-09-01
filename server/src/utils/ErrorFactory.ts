import { AppErrorCode } from "@/constants/appErrorCode";
import { AppError } from "./AppError";

/**
 * Centralized error creation utility
 * Provides consistent error handling across the application
 */
export class ErrorFactory {
  // Authentication Errors
  static invalidCredentials(message = "Invalid email or password") {
    return AppError.unauthorized(message, AppErrorCode.INVALID_CREDENTIALS);
  }

  static invalidToken(message = "Invalid or expired token") {
    return AppError.unauthorized(message, AppErrorCode.INVALID_ACCESS_TOKEN);
  }

  static expiredToken(message = "Token has expired") {
    return AppError.unauthorized(message, AppErrorCode.TOKEN_EXPIRED);
  }

  static emailNotVerified(message = "Please verify your email before proceeding") {
    return AppError.unauthorized(message, AppErrorCode.EMAIL_NOT_VERIFIED);
  }

  // Resource Errors
  static resourceNotFound(resource = "Resource", message?: string) {
    const errorMessage = message || `${resource} not found`;
    return AppError.notFound(errorMessage, AppErrorCode.RESOURCE_NOT_FOUND);
  }

  static resourceExists(resource = "Resource", message?: string) {
    const errorMessage = message || `${resource} already exists`;
    return AppError.conflict(errorMessage, AppErrorCode.RESOURCE_ALREADY_EXISTS);
  }

  // Validation Errors
  static validationFailed(message = "Validation failed", details?: Record<string, unknown>) {
    return AppError.validationError(message, details);
  }

  static requiredField(field: string) {
    return AppError.badRequest(`${field} is required`, AppErrorCode.REQUIRED_FIELD_MISSING);
  }

  static invalidFormat(field: string, expectedFormat?: string) {
    const message = expectedFormat
      ? `${field} must be in ${expectedFormat} format`
      : `Invalid format for ${field}`;
    return AppError.badRequest(message, AppErrorCode.INVALID_FORMAT);
  }

  // Permission Errors
  static insufficientPermissions(message = "Insufficient permissions to perform this action") {
    return AppError.forbidden(message, AppErrorCode.INSUFFICIENT_PERMISSIONS);
  }

  static forbiddenAction(action = "action", message?: string) {
    const errorMessage = message || `Cannot perform ${action}`;
    return AppError.forbidden(errorMessage, AppErrorCode.FORBIDDEN_ACTION);
  }

  // Rate Limiting
  static tooManyRequests(message = "Too many requests, please try again later") {
    return AppError.tooManyRequests(message, AppErrorCode.TOO_MANY_REQUESTS);
  }

  // Server Errors
  static internalError(message = "An internal error occurred", details?: Record<string, unknown>) {
    return AppError.internal(message, AppErrorCode.INTERNAL_SERVER_ERROR, details);
  }

  static databaseError(operation = "operation", details?: Record<string, unknown>) {
    const message = `Database ${operation} failed`;
    return AppError.internal(message, AppErrorCode.DATABASE_ERROR, details);
  }

  static externalServiceError(service = "service", details?: Record<string, unknown>) {
    const message = `External ${service} service error`;
    return AppError.internal(message, AppErrorCode.EXTERNAL_SERVICE_ERROR, details);
  }
}

export default ErrorFactory;
