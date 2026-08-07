# Create 3D Opening — React version

Bản chuyển đổi từ ứng dụng desktop PyQt6 (`_3D_Opening.py`) sang web app React, chạy hoàn toàn trên trình duyệt (client-side) và có thể host miễn phí trên **GitHub Pages**.

## Những gì đã giữ nguyên so với bản gốc

- Toàn bộ logic tính toán: `parseVal` (đọc số có dấu `,` hoặc `.`) và `generateMac` (sinh nội dung file `.mac`) được port 1:1.
- Layout: Position / Dimension / Corner Radius / Orientation / nút OK-Help-Close.
- Xem trước hình khối 3D đẳng cự (isometric) theo đúng công thức chiếu (`kY = 0.55`) và cách đổi trục theo Orientation (X / Y / Z).
- Link nút **Help** trỏ tới đúng tài liệu Google Drive gốc.

## Những thay đổi bắt buộc khi chuyển sang web

- **Xuất file**: trình duyệt không có quyền ghi trực tiếp vào thư mục `Downloads` như ứng dụng desktop (dùng `QFileDialog`), nên nút **OK (Export MAC)** sẽ tải file `3D Opening.mac` xuống qua cơ chế download chuẩn của trình duyệt. Nếu trùng tên, trình duyệt tự thêm số thứ tự (ví dụ `(1)`).
- **Close**: không có khái niệm "đóng cửa sổ" trên web, nên mình đổi thành nút **Reset** để đưa form về giá trị mặc định — hữu ích hơn cho một trang web.
- Canvas 3D vẽ bằng `QPainter` được viết lại bằng SVG (React), giữ nguyên toán chiếu isometric.

## Chạy thử ở máy local

```bash
npm install
npm run dev
```

Mở địa chỉ hiển thị trong terminal (mặc định `http://localhost:5173`).

## Build bản production

```bash
npm run build
```

Kết quả nằm trong thư mục `dist/`.

## Deploy lên GitHub Pages (tự động, khuyến nghị)

Repo đã kèm sẵn workflow `.github/workflows/deploy.yml`, tự build và deploy mỗi khi push lên nhánh `main`.

1. Tạo repo mới trên GitHub, ví dụ `3d-opening-app`.
2. Push toàn bộ thư mục này lên nhánh `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: React 3D Opening tool"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
   git push -u origin main
   ```
3. Vào repo trên GitHub → **Settings → Pages** → mục **Build and deployment** → chọn **Source: GitHub Actions**.
4. Vào tab **Actions**, chờ workflow "Deploy to GitHub Pages" chạy xong (khoảng 1 phút).
5. Trang sẽ có địa chỉ dạng: `https://<tài-khoản>.github.io/<tên-repo>/`

Vì `vite.config.js` dùng `base: './'` (đường dẫn tương đối), bạn **không cần** sửa gì thêm dù đặt tên repo là gì.

## Deploy thủ công (cách khác, không cần Actions)

```bash
npm install -D gh-pages
npm run build
npx gh-pages -d dist
```

Sau đó vào **Settings → Pages → Source** chọn nhánh `gh-pages`.

## Cấu trúc thư mục

```
3d-opening-app/
├── .github/workflows/deploy.yml   # CI/CD tự động deploy GitHub Pages
├── src/
│   ├── App.jsx                    # Toàn bộ UI + logic (form, preview 3D, export .mac)
│   ├── index.css                  # Design tokens (blueprint / kỹ thuật)
│   └── main.jsx                   # Entry point React
├── index.html
├── package.json
└── vite.config.js
```
