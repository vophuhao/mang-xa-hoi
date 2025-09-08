import type { ApiResponse, PaginatedResponse } from '@/types';
import type { Response } from 'express';

/**
 * Utility class for creating consistent API responses
 */
export class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      ...(data !== undefined && { data }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode = 500,
    errors?: string[]
  ): Response<ApiResponse<never>> {
    const response: ApiResponse<never> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message = 'Success',
    statusCode = 200
  ): Response<PaginatedResponse<T>> {
    const response: PaginatedResponse<T> = {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data?: T,
    message = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send bad request response
   */
  static badRequest(
    res: Response,
    message = 'Bad Request',
    errors?: string[]
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 400, errors);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message = 'Unauthorized'
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message = 'Forbidden'
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 403);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message = 'Resource not found'
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 404);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message = 'Conflict',
    errors?: string[]
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 409, errors);
  }

  /**
   * Send unprocessable entity response
   */
  static unprocessableEntity(
    res: Response,
    message = 'Validation failed',
    errors?: string[]
  ): Response<ApiResponse<never>> {
    return this.error(res, message, 422, errors);
  }
}
