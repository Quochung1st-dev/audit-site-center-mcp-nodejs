import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

const websiteParam = z.object({
  website: z.string().describe("ID, slug hoặc domain của website (bắt buộc)"),
});

/**
 * Đăng ký nhóm tool Tài khoản Website.
 * Base URL: /mcp/{website}/accounts/...
 */
export function registerAccountTools(server: McpServer, client: ApiClient): void {
  // 1. Danh sách tài khoản
  server.registerTool(
    "website_accounts_list",
    {
      title: "Danh sách tài khoản website",
      description:
        "Trả về danh sách tài khoản liên kết với website (Google Search Console, GA, WordPress, etc.). " +
        "Có thể lọc theo platform/status, tùy chọn hiển thị credential (reveal).",
      inputSchema: {
        ...websiteParam.shape,
        platform: z.string().optional().describe("Lọc theo nền tảng (gsc, ga, wordpress, facebook, ...)"),
        status: z.enum(["active", "inactive", "expired", "all"]).optional().default("all").describe("Lọc theo trạng thái"),
        reveal: z.boolean().optional().default(false).describe("Hiển thị thông tin nhạy cảm (token/credential)"),
        page: z.number().int().positive().optional().describe("Trang"),
        perPage: z.number().int().positive().max(100).optional().describe("Số lượng mỗi trang"),
      },
    },
    async ({ website, platform, status, reveal, page, perPage }) => {
      try {
        const data = await client.request<{
          items: Array<{
            id: number;
            platform: string;
            accountName: string;
            status: string;
            isPrimary: boolean;
            credentials?: Record<string, string>;
            lastSyncedAt?: string;
          }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { byPlatform: Record<string, number>; activeCount: number };
        }>(`/mcp/${encodeURIComponent(website)}/accounts`, {
          method: "GET",
          query: { platform, status, reveal, page, perPage },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 2. Tài khoản chính
  server.registerTool(
    "website_account_primary",
    {
      title: "Lấy tài khoản chính của website",
      description:
        "Trả về thông tin tài khoản chính (primary) được gán cho website. " +
        "Thường dùng để lấy credential mặc định cho các tác vụ tự động.",
      inputSchema: {
        ...websiteParam.shape,
        reveal: z.boolean().optional().default(false).describe("Hiển thị thông tin nhạy cảm"),
      },
    },
    async ({ website, reveal }) => {
      try {
        const data = await client.request<{
          id: number;
          platform: string;
          accountName: string;
          status: string;
          isPrimary: boolean;
          credentials?: Record<string, string>;
          lastSyncedAt?: string;
        }>(`/mcp/${encodeURIComponent(website)}/accounts/primary`, {
          method: "GET",
          query: { reveal },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 3. Chi tiết tài khoản
  server.registerTool(
    "website_account_show",
    {
      title: "Chi tiết tài khoản website",
      description:
        "Trả về thông tin chi tiết một tài khoản theo ID. " +
        "Bao gồm metadata, trạng thái kết nối, lịch sử đồng bộ (tùy backend).",
      inputSchema: {
        ...websiteParam.shape,
        account: z.number().int().positive().describe("ID tài khoản (bắt buộc)"),
        reveal: z.boolean().optional().default(false).describe("Hiển thị thông tin nhạy cảm"),
      },
    },
    async ({ website, account, reveal }) => {
      try {
        const data = await client.request<{
          id: number;
          platform: string;
          accountName: string;
          status: string;
          isPrimary: boolean;
          credentials?: Record<string, string>;
          metadata?: Record<string, unknown>;
          lastSyncedAt?: string;
          createdAt?: string;
        }>(`/mcp/${encodeURIComponent(website)}/accounts/${account}`, {
          method: "GET",
          query: { reveal },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );
}
