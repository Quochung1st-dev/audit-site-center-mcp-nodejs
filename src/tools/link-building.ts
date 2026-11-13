import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

/**
 * Schema tham số chung cho các tool link-building: cần website (id/slug/domain).
 */
const websiteParam = z.object({
  website: z.string().describe("ID, slug hoặc domain của website (bắt buộc)"),
});

/**
 * Schema tham số cho phân trang và lọc (tùy chọn).
 */
const paginationAndFilter = {
  page: z.number().int().positive().optional().describe("Trang (mặc định 1)"),
  perPage: z.number().int().positive().max(100).optional().describe("Số lượng mỗi trang (mặc định 15, tối đa 100)"),
  sortBy: z.string().optional().describe("Trường sắp xếp"),
  sortDir: z.enum(["asc", "desc"]).optional().describe("Chiều sắp xếp"),
};

/**
 * Đăng ký nhóm tool Link Building.
 * Base URL: /mcp/{website}/audit/link-building/...
 */
export function registerLinkBuildingTools(server: McpServer, client: ApiClient): void {
  // 1. internal-links
  server.registerTool(
    "link_building_internal_links",
    {
      title: "Liên kết nội bộ của website",
      description:
        "Trả về danh sách liên kết nội bộ (internal links) kèm top anchor texts. " +
        "Hữu ích để audit cấu trúc liên kết, phát hiện orphan page, phân bổ link juice.",
      inputSchema: {
        ...websiteParam.shape,
        ...paginationAndFilter,
        minCount: z.number().int().nonnegative().optional().describe("Lọc anchor có số lượng liên kết >= giá trị này"),
      },
    },
    async ({ website, page, perPage, sortBy, sortDir, minCount }) => {
      try {
        const data = await client.request<{
          items: Array<{ sourceUrl: string; targetUrl: string; anchorText: string; linkType: string }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { totalInternalLinks: number; uniqueAnchors: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/link-building/internal-links`, {
          method: "GET",
          query: { page, perPage, sortBy, sortDir, minCount },
        });

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 2. external-links
  server.registerTool(
    "link_building_external_links",
    {
      title: "Liên kết ra ngoài của website",
      description:
        "Trả về danh sách liên kết ra ngoài (external/outbound links) kèm top domain tham chiếu. " +
        "Hữu ích để kiểm tra liên kết gãy, nofollow, chất lượng outbound.",
      inputSchema: {
        ...websiteParam.shape,
        ...paginationAndFilter,
        domain: z.string().optional().describe("Lọc theo domain đích"),
        status: z.enum(["all", "ok", "broken", "redirect"]).optional().describe("Lọc theo trạng thái HTTP"),
      },
    },
    async ({ website, page, perPage, sortBy, sortDir, domain, status }) => {
      try {
        const data = await client.request<{
          items: Array<{ sourceUrl: string; targetUrl: string; anchorText: string; statusCode: number; targetDomain: string }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { totalExternalLinks: number; uniqueDomains: number; brokenCount: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/link-building/external-links`, {
          method: "GET",
          query: { page, perPage, sortBy, sortDir, domain, status },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 3. redirect-links
  server.registerTool(
    "link_building_redirect_links",
    {
      title: "Liên kết chuyển hướng (redirect)",
      description:
        "Trả về danh sách URL có chuyển hướng (3xx) kèm chuỗi hop (redirect chain). " +
        "Hữu ích để phát hiện redirect chain dài, redirect loop, mất link juice.",
      inputSchema: {
        ...websiteParam.shape,
        ...paginationAndFilter,
        redirectType: z.enum(["all", "301", "302", "307", "308"]).optional().describe("Lọc theo loại redirect"),
        maxHops: z.number().int().positive().optional().describe("Chỉ lấy các chuỗi có số hop <= giá trị"),
      },
    },
    async ({ website, page, perPage, sortBy, sortDir, redirectType, maxHops }) => {
      try {
        const data = await client.request<{
          items: Array<{ sourceUrl: string; finalUrl: string; chain: Array<{ url: string; status: number }>; hopCount: number }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { totalRedirects: number; maxHops: number; chainsWithLoops: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/link-building/redirect-links`, {
          method: "GET",
          query: { page, perPage, sortBy, sortDir, redirectType, maxHops },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 4. broken-links
  server.registerTool(
    "link_building_broken_links",
    {
      title: "Liên kết gãy (broken links)",
      description:
        "Trả về danh sách liên kết gãy (4xx, 5xx, timeout) kèm tóm tắt theo mã lỗi. " +
        "Hữu ích để ưu tiên sửa lỗi 404/500, cải thiện UX và SEO.",
      inputSchema: {
        ...websiteParam.shape,
        ...paginationAndFilter,
        statusCode: z.number().int().optional().describe("Lọc theo mã trạng thái cụ thể (404, 500, v.v.)"),
        linkType: z.enum(["all", "internal", "external"]).optional().describe("Loại liên kết"),
      },
    },
    async ({ website, page, perPage, sortBy, sortDir, statusCode, linkType }) => {
      try {
        const data = await client.request<{
          items: Array<{ sourceUrl: string; targetUrl: string; statusCode: number; errorType: string; linkType: string }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { byStatusCode: Record<string, number>; totalBroken: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/link-building/broken-links`, {
          method: "GET",
          query: { page, perPage, sortBy, sortDir, statusCode, linkType },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 5. anchor-texts
  server.registerTool(
    "link_building_anchor_texts",
    {
      title: "Anchor texts toàn website",
      description:
        "Trả về danh sách anchor texts được sử dụng trên toàn website kèm tần suất và phân bố. " +
        "Hữu ích để phát hiện over-optimization, anchor text spam, đa dạng anchor.",
      inputSchema: {
        ...websiteParam.shape,
        ...paginationAndFilter,
        query: z.string().optional().describe("Tìm kiếm anchor text chứa chuỗi"),
        minOccurrences: z.number().int().positive().optional().describe("Chỉ lấy anchor xuất hiện >= lần này"),
      },
    },
    async ({ website, page, perPage, sortBy, sortDir, query, minOccurrences }) => {
      try {
        const data = await client.request<{
          items: Array<{ anchorText: string; count: number; urls: string[]; linkType: "internal" | "external" }>;
          pagination: { total: number; page: number; perPage: number };
          summary?: { totalUniqueAnchors: number; topAnchorShare: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/link-building/anchor-texts`, {
          method: "GET",
          query: { page, perPage, sortBy, sortDir, query, minOccurrences },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );
}
