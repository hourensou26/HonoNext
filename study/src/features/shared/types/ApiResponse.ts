// src/features/shared/types/ApiResponse.ts

/**
 * 成功時のAPIレスポンス型
 */
export interface SuccessResponse<T> {
  data: T;
  statusCode: number;
}

/**
 * エラー時のAPIレスポンス型
 */
export interface ErrorResponse {
  error: string;
  statusCode: number;
  details?: unknown;
}

/**
 * APIレスポンス型（成功またはエラー）
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * ページネーション情報
 */
export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * ページネーション付きレスポンス型
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  statusCode: number;
}
