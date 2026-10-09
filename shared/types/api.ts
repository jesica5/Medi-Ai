export interface ApiMeta {
  timestamp?: string;
  requestId?: string;
  version?: string;
  [key: string]: any;
}

export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMeta;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  meta: ApiMeta;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T>(data: T, meta: ApiMeta = {}): ApiSuccessResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details: ApiErrorDetail[] = [],
  meta: ApiMeta = {}
): ApiErrorResponse {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: {
      code,
      message,
      details,
    },
  };
}
