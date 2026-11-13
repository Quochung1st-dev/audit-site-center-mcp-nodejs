import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

const websiteParam = z.object({
  website: z.string().describe("ID, slug hoặc domain của website (bắt buộc)"),
});

/**
 * Đăng ký tool Website Link (tra cứu liên kết kết hợp website_urls + website_url_audit_titles).
 * URL: /mcp/{website}/website-link (GET/POST)
 */
export function registerWebsiteLinkTool(server: McpServer, client: ApiClient): void {
  server.registerTool(
    "website_link",
    {
      title: "Tra cứu liên kết website (Website Link)",
      description:
        "Truy vấn liên kết website kết hợp dữ liệu từ website_urls và website_url_audit_titles. " +
        "Hỗ trợ GET (query params) và POST (body filter nâng cao). " +
        "Hữu ích để tìm URL theo nhiều tiêu chí: trạng thái, title, meta, lỗi audit, v.v.",
      inputSchema: {
        ...websiteParam.shape,
        // Query params cho GET
        page: z.number().int().positive().optional().describe("Trang"),
        perPage: z.number().int().positive().max(200).optional().describe("Số lượng mỗi trang"),
        status: z.enum(["all", "200", "301", "302", "404", "500", "error"]).optional().default("all").describe("Lọc theo HTTP status"),
        hasTitle: z.boolean().optional().describe("Chỉ URL có/không có title"),
        titleQuery: z.string().optional().describe("Tìm kiếm trong title"),
        urlQuery: z.string().optional().describe("Tìm kiếm trong URL"),
        auditStatus: z.enum(["all", "ok", "warning", "error"]).optional().default("all").describe("Lọc theo trạng thái audit"),
        sortBy: z.string().optional().describe("Trường sắp xếp"),
        sortDir: z.enum(["asc", "desc"]).optional().describe("Chiều sắp xếp"),
        // Body cho POST (filter nâng cao)
        advancedFilter: z
          .object({
            statusCodes: z.array(z.number().int()).optional().describe("Mảng mã trạng thái"),
            titleContains: z.array(z.string()).optional().describe("Title chứa một trong các chuỗi"),
            urlPatterns: z.array(z.string()).optional().describe("URL khớp pattern (glob/regex)"),
            metaFilters: z.record(z.unknown()).optional().describe("Lọc meta fields tùy chỉnh"),
            dateFrom: z.string().optional().describe("Ngày crawl từ (YYYY-MM-DD)"),
            dateTo: z.string().optional().describe("Ngày crawl đến (YYYY-MM-DD)"),
          })
          .optional()
          .describe("Bộ lọc nâng cao (chỉ dùng khi POST)"),
      },
    },
    async ({
      website,
      page,
      perPage,
      status,
      hasTitle,
      titleQuery,
      urlQuery,
      auditStatus,
      sortBy,
      sortDir,
      advancedFilter,
    }) => {
      try {
        // Nếu có advancedFilter thì dùng POST, ngược lại GET
        const method = advancedFilter ? "POST" : "GET";
        const query = {
          page,
          perPage,
          status,
          hasTitle,
          titleQuery,
          urlQuery,
          auditStatus,
          sortBy,
          sortDir,
        };
        const body = advancedFilter ? advancedFilter : undefined;

        const data = await client.request<{
          items: Array<{
            id: number;
            url: string;
            title: string;
            statusCode: number;
            auditStatus: string;
            meta?: Record<string, unknown>;
            crawledAt?: string;
          }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { byStatus: Record<string, number>; byAuditStatus: Record<string, number> };
        }>(`/mcp/${encodeURIComponent(website)}/website-link`, {
          method,
          query: method === "GET" ? query : undefined,
          body,
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );
}
