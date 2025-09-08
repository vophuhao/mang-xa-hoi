/**
 * Central export point for all error handling utilities
 * This provides a clean API for importing error handling components
 */

// Main error class
export { AppError } from "./AppError";

// Error factory for consistent error creation
export { ErrorFactory } from "./ErrorFactory";

// Error codes enum
export { AppErrorCode } from "@/constants/appErrorCode";

// Utilities
export { default as appAssert } from "./appAssert";
export { default as catchErrors } from "./catchErrors";

// Default exports for backward compatibility
export { default as AppErrorDefault } from "./AppError";
export { default as ErrorFactoryDefault } from "./ErrorFactory";

/**
 * Re-export for convenience - allows importing like:
 * import { AppError, ErrorFactory, AppErrorCode } from '@/utils/errors';
 */
