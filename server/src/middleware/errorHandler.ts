import type { ErrorRequestHandler, Response } from "express";
import { z } from "zod";

import { AppError } from "@/utils/AppError";
import { REFRESH_PATH, clearAuthCookies } from "@/utils/cookies";
import { ResponseUtil } from "@/utils/response";

/**
 * Handle Zod validation errors
 */
const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map(err => `${err.path.join(".")}: ${err.message}`);
  return ResponseUtil.unprocessableEntity(res, "Validation failed", errors);
};

/**
 * Handle custom AppError instances
 */
const handleAppError = (res: Response, error: AppError) => {
  const response = {
    success: false,
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // Log errors in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.error(`❌ Error on ${req.method} ${req.path}:`, error);
  }

  // Log operational errors in production for monitoring
  if (process.env.NODE_ENV === "production" && error instanceof AppError && !error.isOperational) {
    console.error("Non-operational error:", error);
  }

  // Clear auth cookies on refresh token errors
  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  // Handle specific error types
  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  // Handle unexpected errors
  return ResponseUtil.error(res, "Internal server error", 500);
};

export default errorHandler;
