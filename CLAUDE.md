# CLAUDE.md — AuditSite Center MCP (Node.js)

> File hướng dẫn dành cho Claude / agent khi làm việc trong repo này.
> Ưu tiên: đọc file này trước khi code, commit, hoặc tạo PR.

## Ràng buộc chế độ (Mode Enforcement)
- **Không tự ý Plan Mode**: Cấm gọi `EnterPlanMode` khi chưa có yêu cầu rõ ràng.
- **Luôn dùng `bypassPermissions`**: Thực thi công cụ liền mạch, không hỏi xin quyền.
- **Luôn dùng `ultracode`**: Tự động điều phối workflow / multi-agent với suy luận tối đa cho mọi tác vụ.
- **Cấm chạy background**: Không chạy Workflow/Agent ngầm. Bắt buộc đặt `run_in_background: false`, chạy foreground hiển thị trực tiếp tiến trình.

## Thông tin dự án
- **Tên dự án**: AuditSite Center MCP Server
- **Mục tiêu**: Cung cấp MCP server (Model Context Protocol) bằng Node.js làm lớp công cụ cho AI agent tương tác với hệ thống AuditSite Center (kiểm toán/quản lý audit site).
- **Backend liên kết**: [audit-site-center-laravel](../audit-site-center-laravel/) (Laravel 12, PHP 8.2+; API trung tâm xác thực, nghiệp vụ audit, Redis Horizon, Pulse).
- **Tech stack (dự kiến/chuẩn)**: Node.js (>= 20), TypeScript, `@modelcontextprotocol/sdk`, `zod` (validate schema), `esbuild` (bundle).

## Ngôn ngữ & quy ước
- **Giao tiếp**: Phản hồi người dùng bằng ngôn ngữ của tin nhắn gần nhất (mặc định: tiếng Việt có dấu).
- **Mã nguồn**: Tên biến/hàm/lớp/bảng/cột dùng tiếng Anh ASCII theo convention:
  - `camelCase`: biến, thuộc tính, hàm.
  - `PascalCase`: class, interface, type.
  - `UPPER_SNAKE_CASE`: hằng số.
- **Comment & DocBlock**: Viết bằng **tiếng Việt có dấu**, ngắn gọn, rõ mục đích nghiệp vụ; tên biến/hàm trong code giữ ASCII.

## Cấu trúc mã nguồn (tham chiếu)
Khi khởi tạo/triển khai, ưu tiên cấu trúc tương tự dự án MCP tham chiếu:

```
├── src/
│   ├── index.ts          # Khởi tạo McpServer, đăng ký tools, chạy stdio transport
│   ├── config.ts         # Đọc biến môi trường/cấu hình
│   ├── client.ts         # HTTP client gọi API backend Laravel (/mcp hoặc endpoint tương ứng)
│   ├── types.ts          # DTO/types dùng chung
│   └── tools/            # Nhóm tool theo miền nghiệp vụ
├── test/                 # Unit/self-check test
├── dist/                 # Kết quả build (bundle)
├── .env.example          # Mẫu biến môi trường
├── package.json
└── tsconfig.json
```

## Cấu hình & chạy (chuẩn dự kiến)
- **Biến môi trường**: lưu trong `.env` (không commit secret), cung cấp `.env.example`. Tối thiểu: URL API backend và token xác thực (ví dụ `AUDIT_SITE_API_URL`, `AUDIT_SITE_API_TOKEN` — đặt tên chính xác theo triển khai thực tế).
- **Scripts tham chiếu** (package.json):
  - `npm run build`: bundle ra `dist/index.js` (esbuild, ESM, Node 20).
  - `npm run typecheck`: `tsc --noEmit`.
  - `npm start`: chạy `node dist/index.js`.
  - `npm run dev`: `tsx watch src/index.ts`.
  - `npm test`: `node --import tsx --test`.
- **Tích hợp MCP client**: khai báo trong `.mcp.json`/Claude Desktop với `command: "node"` trỏ `dist/index.js` và truyền env cần thiết.

## Nguyên tắc phát triển
- **Tối giản (YAGNI/KISS/DRY)**: chỉ xây thứ được yêu cầu; ưu tiên stdlib/dep có sẵn; tránh trừu tượng hóa sớm.
- **Bất biến & rõ ràng**: không mutate dữ liệu chia sẻ ngoài ý muốn; hàm nhỏ, tên mô tả đúng mục đích.
- **An toàn**: không hardcode secret/token; validate input tại biên (schema/zod cho tham số tool); không log dữ liệu nhạy cảm.
- **Xử lý lỗi**: trả lỗi MCP có ngữ cảnh rõ ràng, thân thiện cho agent; không nuốt lỗi âm thầm.
- **Kiểm thử**: với logic không tầm thường, bổ sung kiểm thử tự động (unit/integration) phù hợp; xác minh trước khi hoàn tất.

## Git & commit
- Tuân thủ conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`...).
- Commit message **bắt buộc bằng tiếng Việt có dấu** (tiêu đề + mô tả thay đổi).
- Chỉ commit local; **không tự động push** khi chưa có yêu cầu trực tiếp. Không thêm `Co-Authored-By`.
