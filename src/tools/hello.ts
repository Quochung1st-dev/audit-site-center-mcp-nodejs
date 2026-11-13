import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

/**
 * Đăng ký tool `hello` — tool mẫu minh họa cách gọi API backend.
 * Khi nhận lệnh, tool sẽ gọi GET /mcp/hello từ Laravel và trả kết quả.
 */
export function registerHelloTool(server: McpServer, client: ApiClient): void {
  server.registerTool(
    "hello",
    {
      title: "Chào hỏi từ AuditSite Center",
      description: "Gọi endpoint /mcp/hello của backend Laravel để kiểm tra kết nối.",
      inputSchema: { name: z.string().optional().describe("Tên người dùng (tùy chọn)") },
    },
    async ({ name }) => {
      try {
        const data = await client.request<{ message: string }>("/mcp/hello", {
          method: "GET",
          query: { name },
        });

        return {
          content: [
            {
              type: "text",
              text: data.message ?? "Backend không trả về nội dung message.",
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Lỗi khi gọi API: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
