/**
 * Kiểu dữ liệu lỗi API chuẩn hóa dùng chung.
 */
export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Response bọc chuẩn từ API backend.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
  meta?: Record<string, unknown>;
}

/**
 * Tùy chọn gọi API nội bộ.
 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}
