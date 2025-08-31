import type { ErrorRequestHandler, Response } from "express";
import { z } from "zod";

import { AppError } from "@/utils/AppError";
import { REFRESH_PATH, clearAuthCookies } from "@/utils/cookies";
import { ResponseUtil } from "@/utils/response";

const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map(err => `${err.path.join(".")}: ${err.message}`);

  return ResponseUtil.unprocessableEntity(res, "Validation failed", errors);
};

const handleAppError = (res: Response, error: AppError) => {
  return ResponseUtil.error(res, error.message, error.statusCode);
};

const errorHandler: ErrorRequestHandler = (error, req, res) => {
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.error(`PATH ${req.path}`, error);
  }

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

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
