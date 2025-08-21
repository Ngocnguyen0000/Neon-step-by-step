# AI Step‑by‑Step Drawing Automator

Tạo ảnh vecto (SVG) từng nét vẽ từ mô tả, xem lại từng bước và xuất nhiều định dạng.

## Tính năng
- Nhập prompt để AI (Gemini) sinh SVG line‑art, mỗi nét là một `<path>` (phù hợp hướng dẫn từng bước)
- Upload `.svg` hoặc `.png/.jpeg` (sẽ vector hóa bằng Potrace) để xử lý thành các bước
- Xem lại từng bước, phát/tạm dừng, kéo thanh trượt
- Xuất: SVG, PNG, WebP, WebM (video), GIF (nền trong suốt), ZIP tất cả bước (PNG/WebP)

## Yêu cầu
- Node.js LTS (khuyến nghị v18+)

## Chạy Local
1) Cài phụ thuộc
```bash
npm install
```

2) Đặt API key Gemini vào file `.env.local` ở thư mục gốc
```bash
GEMINI_API_KEY=YOUR_REAL_GEMINI_KEY
```
Vite sẽ map `GEMINI_API_KEY` → `process.env.API_KEY`. Nếu để trống hoặc placeholder, app sẽ báo lỗi rõ ràng.

3) Chạy dev server
```bash
npm run dev
```
Mở địa chỉ hiển thị (mặc định `http://localhost:5173`).

## Bảo mật API key (QUAN TRỌNG)
Không thể “ẩn/mã hóa” API key nếu gọi trực tiếp từ trình duyệt. Cách đúng:
- Tạo backend/proxy (Express/Vercel/Netlify/Cloudflare Workers, v.v.)
  - Lưu `GEMINI_API_KEY` ở biến môi trường server
  - Viết endpoint (ví dụ `POST /api/generate`) gọi Gemini và trả `svgString`
  - Frontend chỉ gọi endpoint của bạn, KHÔNG giữ key ở client
- Hạn chế trong Google Cloud: API restrictions (Generative Language API), rate limit, v.v.

Pseudo ví dụ backend:
```ts
// server/api/generate.ts
export default async (req, res) => {
  const { prompt } = await req.json();
  // dùng process.env.GEMINI_API_KEY gọi Gemini và trả về svgString
  res.json({ svgString });
};
```
Client thay vì gọi trực tiếp Gemini, hãy `fetch('/api/generate')`.

## Xuất file & nền
- PNG/WebP: render SVG bằng `canvg` lên canvas (mặc định trong suốt) → xuất ảnh.
- GIF: dùng `gif.js` với chroma key để bảo toàn trong suốt; hoặc có thể cấu hình nền trắng nếu muốn.
- WebM: xuất từ canvas; một số trình duyệt không hỗ trợ alpha trong WebM. Nếu muốn nền trắng, fill nền trước khi vẽ.

Đổi nền trắng (tùy chọn):
- Ở `utils/imageUtils.ts`, trước khi `drawImage`, có thể `fillRect` màu trắng.
- Ở GIF/Video trong `App.tsx`, có thể fill trắng mỗi frame.

## Troubleshooting
- 400 INVALID_ARGUMENT / API key not valid: kiểm tra `.env.local` và restart `npm run dev`.
- Không export được PNG/WebP/GIF/ZIP: đảm bảo đã cài `canvg` qua npm, mạng không chặn, và refresh trang.
- GIF Worker CORS: dự án đã fetch `gif.worker.js` và tạo Blob URL cùng origin tự động.

## Build & Preview (Production)
```bash
npm run build
npm run preview
```

### Ghi chú Tailwind
Hiện app dùng `cdn.tailwindcss.com` cho dev. Với production, nên cài Tailwind qua npm + PostCSS để purge CSS: xem hướng dẫn tại https://tailwindcss.com/docs/installation