import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

const websiteParam = z.object({
  website: z.string().describe("ID, slug hoặc domain của website (bắt buộc)"),
});

/**
 * Đăng ký nhóm tool Knowledge Graph & Embedding.
 * Base URL: /mcp/{website}/audit/graph/...
 */
export function registerKnowledgeGraphTools(server: McpServer, client: ApiClient): void {
  // 1. graph show
  server.registerTool(
    "knowledge_graph_show",
    {
      title: "Đồ thị tri thức (Knowledge Graph)",
      description:
        "Trả về đồ thị tri thức liên kết theo từ khóa chính hoặc URL. " +
        "Hữu ích để hiểu cấu trúc chủ đề, cluster nội dung, phân bổ quyền thương hiệu.",
      inputSchema: {
        ...websiteParam.shape,
        keyword: z.string().optional().describe("Từ khóa chính để xây dựng đồ thị xung quanh"),
        url: z.string().url().optional().describe("URL cụ thể để lấy đồ thị lân cận"),
        depth: z.number().int().positive().max(3).optional().default(2).describe("Độ sâu đồ thị (1-3)"),
        limit: z.number().int().positive().max(500).optional().default(100).describe("Số nút tối đa"),
      },
    },
    async ({ website, keyword, url, depth, limit }) => {
      try {
        const data = await client.request<{
          nodes: Array<{ id: string; label: string; url: string; type: "keyword" | "page"; weight: number }>;
          edges: Array<{ source: string; target: string; type: "internal" | "semantic"; strength: number }>;
          meta?: { centerKeyword?: string; centerUrl?: string; nodeCount: number; edgeCount: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/graph`, {
          method: "GET",
          query: { keyword, url, depth, limit },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 2. anchor-audit
  server.registerTool(
    "knowledge_graph_anchor_audit",
    {
      title: "Đồ thị tri thức kèm phân tích Anchor Text",
      description:
        "Trả về đồ thị tri thức mở rộng với phân tích anchor text ngoài cây (out-of-tree anchors). " +
        "Hữu ích để phát hiện anchor text không tự nhiên, manipulative linking.",
      inputSchema: {
        ...websiteParam.shape,
        keyword: z.string().optional().describe("Từ khóa chính"),
        url: z.string().url().optional().describe("URL cụ thể"),
        depth: z.number().int().positive().max(3).optional().default(2).describe("Độ sâu đồ thị"),
        limit: z.number().int().positive().max(500).optional().default(100).describe("Số nút tối đa"),
        includeExternalAnchors: z.boolean().optional().default(true).describe("Bao gồm anchor từ domain ngoài"),
      },
    },
    async ({ website, keyword, url, depth, limit, includeExternalAnchors }) => {
      try {
        const data = await client.request<{
          nodes: Array<{ id: string; label: string; url: string; type: string; weight: number }>;
          edges: Array<{ source: string; target: string; type: string; anchorText: string; isExternal: boolean; strength: number }>;
          anchorAnalysis?: { suspiciousAnchors: string[]; diversityScore: number; externalAnchorRatio: number };
          meta?: { nodeCount: number; edgeCount: number; externalAnchorCount: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/graph/anchor-audit`, {
          method: "GET",
          query: { keyword, url, depth, limit, includeExternalAnchors },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );

  // 3. similar-urls
  server.registerTool(
    "knowledge_graph_similar_urls",
    {
      title: "Tìm URL tương tự theo Embedding",
      description:
        "Trả về các URL có vector embedding gần nhau (cosine similarity). " +
        "Hữu ích để phát hiện nội dung trùng lặp (near-duplicate), cannibalization, gợi ý nội dung liên quan.",
      inputSchema: {
        ...websiteParam.shape,
        url: z.string().url().describe("URL gốc để tìm các URL tương tự (bắt buộc)"),
        threshold: z.number().min(0).max(1).optional().default(0.75).describe("Ngưỡng cosine similarity (0-1)"),
        limit: z.number().int().positive().max(50).optional().default(10).describe("Số kết quả tối đa"),
        excludeSelf: z.boolean().optional().default(true).describe("Loại bỏ chính URL gốc"),
      },
    },
    async ({ website, url, threshold, limit, excludeSelf }) => {
      try {
        const data = await client.request<{
          items: Array<{ url: string; title: string; similarity: number; keywordOverlap: string[] }>;
          meta?: { sourceUrl: string; threshold: number; totalFound: number };
        }>(`/mcp/${encodeURIComponent(website)}/audit/graph/similar-urls`, {
          method: "GET",
          query: { url, threshold, limit, excludeSelf },
        });

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Lỗi: ${message}` }], isError: true };
      }
    },
  );
}
