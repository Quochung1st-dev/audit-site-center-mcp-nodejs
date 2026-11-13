import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

const websiteParam = z.object({
  website: z.string().describe("ID, slug hoặc domain của website (bắt buộc)"),
});

/**
 * Đăng ký nhóm tool Từ khóa (Keyword).
 * Base URL: /mcp/{website}/audit/keyword/...
 */
export function registerKeywordTools(server: McpServer, client: ApiClient): void {
  // 1. Danh sách từ khóa toàn site
  server.registerTool(
    "keyword_list",
    {
      title: "Danh sách từ khóa toàn site",
      description:
        "Trả về danh sách từ khóa chính/phụ trên toàn website, kèm chỉ số cannibalization (cạnh tranh nội bộ). " +
        "Hữu ích để xem coverage từ khóa, phát hiện trùng lặp mục tiêu keyword giữa các trang.",
      inputSchema: {
        ...websiteParam.shape,
        page: z.number().int().positive().optional().describe("Trang"),
        perPage: z.number().int().positive().max(100).optional().describe("Số lượng mỗi trang"),
        type: z.enum(["all", "primary", "secondary"]).optional().default("all").describe("Loại từ khóa"),
        search: z.string().optional().describe("Tìm kiếm từ khóa chứa chuỗi"),
        cannibalizedOnly: z.boolean().optional().default(false).describe("Chỉ hiển thị từ khóa bị cannibalization"),
        sortBy: z.enum(["keyword", "volume", "position", "pageCount"]).optional().describe("Trường sắp xếp"),
        sortDir: z.enum(["asc", "desc"]).optional().describe("Chiều sắp xếp"),
      },
    },
    async ({ website, page, perPage, type, search, cannibalizedOnly, sortBy, sortDir }) => {
      try {
        const data = await client.request<{
          items: Array<{
            keyword: string;
            type: "primary" | "secondary";
            targetUrls: string[];
            volume?: number;
            position?: number;
            isCannibalized: boolean;
          }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { totalKeywords: number; primaryCount: number; secondaryCount: number; cannibalizedCount: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/keyword`, {
          method: "GET",
          query: { page, perPage, type, search, cannibalizedOnly, sortBy, sortDir },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 2. Kiểm tra từ khóa
  server.registerTool(
    "keyword_check",
    {
      title: "Kiểm tra từ khóa tồn tại",
      description:
        "Kiểm tra 1 từ khóa đã tồn tại trên website chưa (primary/secondary), kèm các URL đang nhắm tới từ khóa đó. " +
        "Hữu ích trước khi tạo nội dung mới để tránh cannibalization.",
      inputSchema: {
        ...websiteParam.shape,
        keyword: z.string().min(1).describe("Từ khóa cần kiểm tra (bắt buộc)"),
        exactMatch: z.boolean().optional().default(true).describe("So khớp chính xác hay tương đối"),
      },
    },
    async ({ website, keyword, exactMatch }) => {
      try {
        const data = await client.request<{
          keyword: string;
          exists: boolean;
          matches: Array<{
            matchedKeyword: string;
            type: "primary" | "secondary";
            targetUrl: string;
            pageTitle?: string;
          }>;
          recommendation?: string;
        }>(`/mcp/${encodeURIComponent(website)}/audit/keyword/check`, {
          method: "GET",
          query: { keyword, exactMatch },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );
}
