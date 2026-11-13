import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("ném lỗi khi thiếu AUDIT_SITE_API_URL", () => {
    assert.throws(
      () => loadConfig({ AUDIT_SITE_API_URL: "" } as any),
      /AUDIT_SITE_API_URL phải là URL hợp lệ/,
    );
  });

  it("nhận cấu hình hợp lệ", () => {
    const config = loadConfig({
      AUDIT_SITE_API_URL: "http://localhost:8000",
      AUDIT_SITE_API_TOKEN: "test-token",
      MCP_SERVER_NAME: "test-server",
      LOG_LEVEL: "debug",
    });
    assert.equal(config.AUDIT_SITE_API_URL, "http://localhost:8000");
    assert.equal(config.AUDIT_SITE_API_TOKEN, "test-token");
    assert.equal(config.MCP_SERVER_NAME, "test-server");
    assert.equal(config.LOG_LEVEL, "debug");
  });

  it("dùng giá trị mặc định khi thiếu các trường tùy chọn", () => {
    const config = loadConfig({ AUDIT_SITE_API_URL: "http://localhost:8000" });
    assert.equal(config.MCP_SERVER_NAME, "audit-site-center");
    assert.equal(config.LOG_LEVEL, "info");
  });
});
