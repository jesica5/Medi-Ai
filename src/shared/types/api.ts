export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  meta: Record<string, unknown>;
  error: ApiError | null;
}

export function createSuccessResponse<T>(data: T, meta: Record<string, unknown> = {}): ApiResponse<T> {
  return {
    data,
    meta,
    error: null,
  };
}

export function createErrorResponse<T = never>(
  code: string,
  message: string,
  details: unknown[] = [],
  meta: Record<string, unknown> = {}
): ApiResponse<T> {
  return {
    data: null,
    meta,
    error: {
      code,
      message,
      details,
    },
  };
}
