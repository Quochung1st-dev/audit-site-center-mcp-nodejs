import type { AppConfig } from "./config.js";
import type { ApiEnvelope, RequestOptions } from "./types.js";

/**
 * Lỗi phát sinh khi gọi API backend.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * HTTP client tối giản gọi API AuditSite Center.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(config: AppConfig) {
    this.baseUrl = config.AUDIT_SITE_API_URL.replace(/\/+$/, "");
    this.token = config.AUDIT_SITE_API_TOKEN;
  }

  /**
   * Ghép query string từ object, bỏ qua giá trị undefined.
   */
  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /**
   * Thực hiện request tới API, tự động parse envelope JSON.
   * Ném ApiClientError khi HTTP status không thành công hoặc envelope báo lỗi.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, signal, headers } = options;
    const url = this.buildUrl(path, query);

    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    };
    if (this.token) requestHeaders.Authorization = `Bearer ${this.token}`;

    const init: RequestInit = {
      method,
      headers: requestHeaders,
    };
    if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    if (signal) init.signal = signal;

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (cause) {
      throw new ApiClientError(
        `Không thể kết nối tới API ${url}`,
        0,
        undefined,
        cause,
      );
    }

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;

    if (!response.ok || payload?.success === false) {
      const message = payload?.error?.message ?? `HTTP ${response.status}`;
      throw new ApiClientError(message, response.status, payload);
    }

    return (payload?.data ?? payload) as T;
  }
}
