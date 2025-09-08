// Re-export all types for easier imports
export * from './api';

// Type guards
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isObject = (value: unknown): value is object => 
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);

// Async utility types
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

// Service result types
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

// HTTP Status codes type
export type HttpStatusCode = 
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 503; // Service Unavailable
