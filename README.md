# AuditSite Center MCP

MCP (Model Context Protocol) server viết bằng Node.js/TypeScript làm lớp công cụ cho AI agent tương tác với hệ thống **AuditSite Center** (kiểm toán/quản lý audit site). Backend liên kết là dự án Laravel tại [audit-site-center-laravel](../audit-site-center-laravel/), cung cấp API xác thực, nghiệp vụ audit, Redis Horizon và Pulse.

## Tính năng

- Khởi tạo `McpServer` và chạy qua **stdio transport** (chuẩn giao tiếp MCP).
- Cấu hình qua biến môi trường, kiểm tra hợp lệ bằng `zod`.
- HTTP client tối giản gọi API backend (tự động parse envelope JSON, gắn `Authorization: Bearer`).
- Đăng ký **14 tool** theo 5 nhóm nghiệp vụ, đối chiếu với `routes/mcp.php` của backend:
  - **Link Building** (5): liên kết nội bộ, liên kết ra ngoài, chuyển hướng, liên kết gãy, anchor texts.
  - **Knowledge Graph** (3): đồ thị tri thức, đồ thị anchor audit, tìm URL tương tự theo embedding.
  - **Keyword** (2): danh sách từ khóa toàn site, kiểm tra từ khóa tồn tại.
  - **Website Accounts** (3): danh sách tài khoản, tài khoản chính, chi tiết tài khoản.
  - **Website Link** (1): tra cứu liên kết website (GET/POST, filter nâng cao).
- Build bundle bằng `esbuild` (ESM, target Node 20).

## Yêu cầu

- Node.js **>= 20**
- Backend AuditSite Center đang chạy (địa chỉ cấu hình qua `AUDIT_SITE_API_URL`)

## Cài đặt

```bash
npm install
cp .env.example .env
# Chỉnh sửa .env: AUDIT_SITE_API_URL, AUDIT_SITE_API_TOKEN (nếu cần)
```

## Cấu hình môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|----------|----------|-------|
| `AUDIT_SITE_API_URL` | Có | — | URL gốc API backend (ví dụ `http://localhost:8000`) |
| `AUDIT_SITE_API_TOKEN` | Không | — | Token xác thực gọi API (Bearer) |
| `MCP_SERVER_NAME` | Không | `audit-site-center` | Tên server MCP hiển thị |
| `LOG_LEVEL` | Không | `info` | Mức log: `debug` \| `info` \| `warn` \| `error` |

> Không commit `.env`; các giá trị nhạy cảm phải nằm trong biến môi trường.

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run build` | Bundle ra `dist/index.js` bằng esbuild (ESM, Node 20) |
| `npm run typecheck` | Kiểm tra kiểu bằng `tsc --noEmit` |
| `npm start` | Chạy `node dist/index.js` |
| `npm run dev` | Chạy chế độ phát triển `tsx watch src/index.ts` |
| `npm test` | Chạy test bằng Node test runner (`node --import tsx --test`) |

## Sử dụng với MCP Client

Khai báo trong `.mcp.json` hoặc cấu hình Claude Desktop:

```json
{
  "mcpServers": {
    "audit-site-center": {
      "command": "node",
      "args": ["/đường/dẫn/tới/audit-site-center-mcp-nodejs/dist/index.js"],
      "env": {
        "AUDIT_SITE_API_URL": "http://localhost:8000",
        "AUDIT_SITE_API_TOKEN": "token_của_bạn"
      }
    }
  }
}
```

Sau khi client kết nối, các tool đã đăng ký (ví dụ `hello`) sẽ khả dụng cho AI agent.

## Cấu trúc thư mục

```
├── src/
│   ├── index.ts      # Khởi tạo McpServer, đăng ký tools, chạy stdio transport
│   ├── config.ts     # Đọc và validate biến môi trường (zod)
│   ├── client.ts     # HTTP client gọi API backend Laravel
│   ├── types.ts      # DTO/types dùng chung
│   └── tools/        # Nhóm tool theo miền nghiệp vụ
├── test/             # Unit/self-check test (Node test runner)
├── dist/             # Kết quả build (esbuild bundle)
├── .env.example      # Mẫu biến môi trường
├── package.json
└── tsconfig.json
```

## Phát triển

### Thêm tool mới

1. Tạo file trong `src/tools/`, ví dụ `src/tools/audit.ts`.
2. Hàm `registerXxxTool(server: McpServer, client: ApiClient)` dùng `server.registerTool` với:
   - `title`, `description`
   - `inputSchema` (zod) mô tả tham số
   - handler `async` gọi `client.request<T>(...)`, trả về `{ content: [{ type: "text", text }] }`.
3. Đăng ký trong `src/index.ts`.

### Quy ước mã nguồn

- Biến/hàm: `camelCase`; class/interface: `PascalCase`; hằng số: `UPPER_SNAKE_CASE`.
- Comment/docblock: tiếng Việt có dấu, ngắn gọn; tên code giữ ASCII.
- Bất biến (không mutate dữ liệu chia sẻ), hàm nhỏ, xử lý lỗi rõ ràng.
- Kiểm thử cho logic không tầm thường.

## Kiểm thử

```bash
npm test
```

## Đóng góp & Quy chuẩn

- Commit message theo conventional commits, viết bằng tiếng Việt có dấu (tiêu đề + mô tả).
- Chỉ commit local; không tự động push khi chưa có yêu cầu.
- Không thêm `Co-Authored-By`.

## Giấy phép

Chưa xác định (cập nhật khi có quyết định).

## Liên kết

- Backend: [audit-site-center-laravel](../audit-site-center-laravel/)
- Tài liệu MCP: https://modelcontextprotocol.io/
- SDK: `@modelcontextprotocol/sdk`
