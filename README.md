# Tauri + React + Typescript

# ClassView Pro 🎓

Nền tảng chia sẻ màn hình chất lượng cao cho lớp học, sử dụng WebRTC để kết nối giáo viên và học sinh trong thời gian thực.

## ✨ Tính Năng

- 🖥️ **Chia sẻ màn hình HD** - 1080p, 30fps với độ trễ thấp
- 🎯 **2 chế độ kết nối** - Socket.IO (LAN) và PeerJS (P2P)
- 👨‍🏫 **Giao diện Giáo viên** - Quản lý lớp học, theo dõi học sinh
- 👨‍🎓 **Giao diện Học sinh** - Xem màn hình, điều khiển đơn giản
- 🎨 **UI/UX hiện đại** - Dark theme, responsive, animations mượt mà
- 🔊 **Âm thanh** - Hỗ trợ chia sẻ âm thanh từ màn hình
- 📱 **Responsive** - Hoạt động tốt trên mọi kích thước màn hình

## 🚀 Khởi Động Nhanh

### 1. Cài đặt
```bash
npm install
```

### 2. Chạy ứng dụng
```bash
npm run dev
```
Truy cập: `http://localhost:1420`

### 3. Chạy Socket.IO Server (nếu dùng chế độ Socket.IO)
```bash
cd server
npm install
node index.js
```

## 📖 Hướng Dẫn Chi Tiết

Xem file [CLASSVIEW_PRO_GUIDE.md](./CLASSVIEW_PRO_GUIDE.md) để biết:
- Hướng dẫn sử dụng chi tiết
- So sánh 2 chế độ kết nối
- Xử lý sự cố
- Kiến trúc kỹ thuật

## 🔧 Công Nghệ

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **WebRTC**: Native WebRTC API
- **Signaling**: Socket.IO / PeerJS
- **Desktop**: Tauri 2.0

## 📋 Tóm Tắt Tích Hợp

Xem file [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) để biết:
- Những gì đã được tích hợp
- Cấu trúc thư mục
- So sánh code cũ vs mới
- Migration path

## 🎯 Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
