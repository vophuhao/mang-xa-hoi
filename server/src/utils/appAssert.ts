import { AppErrorCode } from "@/constants/appErrorCode";
import { HttpStatusCode } from "@/constants/http";
import assert from "node:assert";
import AppError from "./AppError";

type AppAssert = (
  condition: any,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 * Provides a consistent way to handle assertions throughout the application.
 */
const appAssert: AppAssert = (condition, httpStatusCode, message, appErrorCode) => {
  // Default error codes based on status code if not provided
  const getDefaultErrorCode = (statusCode: HttpStatusCode): AppErrorCode => {
    switch (statusCode) {
      case 400:
        return AppErrorCode.VALIDATION_ERROR;
      case 401:
        return AppErrorCode.INVALID_CREDENTIALS;
      case 403:
        return AppErrorCode.INSUFFICIENT_PERMISSIONS;
      case 404:
        return AppErrorCode.RESOURCE_NOT_FOUND;
      case 409:
        return AppErrorCode.RESOURCE_CONFLICT;
      case 422:
        return AppErrorCode.VALIDATION_ERROR;
      case 429:
        return AppErrorCode.TOO_MANY_REQUESTS;
      case 500:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
      default:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
    }
  };

  const errorCode = appErrorCode || getDefaultErrorCode(httpStatusCode);

  assert(condition, new AppError(httpStatusCode, message, errorCode));
};

export default appAssert;
