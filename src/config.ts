import { z } from "zod";

/**
 * Schema kiểm tra biến môi trường cần thiết cho MCP server.
 */
const envSchema = z.object({
  AUDIT_SITE_API_URL: z.string().url("AUDIT_SITE_API_URL phải là URL hợp lệ"),
  AUDIT_SITE_API_TOKEN: z.string().min(1).optional(),
  MCP_SERVER_NAME: z.string().min(1).default("audit-site-center"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppConfig = z.infer<typeof envSchema>;

/**
 * Đọc và kiểm tra cấu hình từ biến môi trường.
 * Ném lỗi rõ ràng nếu cấu hình không hợp lệ.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Cấu hình môi trường không hợp lệ: ${issues}`);
  }
  return parsed.data;
}
