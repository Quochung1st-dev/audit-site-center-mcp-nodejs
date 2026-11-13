#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ApiClient } from "./client.js";
import { registerHelloTool } from "./tools/hello.js";
import { registerLinkBuildingTools } from "./tools/link-building.js";
import { registerKnowledgeGraphTools } from "./tools/knowledge-graph.js";
import { registerKeywordTools } from "./tools/keyword.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerWebsiteLinkTool } from "./tools/website-link.js";

/**
 * Điểm khởi tạo MCP server: nạp cấu hình, khởi tạo client,
 * đăng ký các tool theo miền nghiệp vụ, và chạy stdio transport.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const client = new ApiClient(config);

  const server = new McpServer({ name: config.MCP_SERVER_NAME, version: "0.1.0" });

  // Đăng ký tool theo nhóm miền nghiệp vụ
  registerHelloTool(server, client);
  registerLinkBuildingTools(server, client);
  registerKnowledgeGraphTools(server, client);
  registerKeywordTools(server, client);
  registerAccountTools(server, client);
  registerWebsiteLinkTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log ra stderr để không làm nhiễu giao thức stdio (stdout)
  console.error(`[${config.MCP_SERVER_NAME}] MCP server đã sẵn sàng.`);
}

main().catch((error: unknown) => {
  console.error("MCP server khởi tạo thất bại:", error);
  process.exit(1);
});
