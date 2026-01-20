# ClassView Pro - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

ClassView Pro là nền tảng chia sẻ màn hình chất lượng cao cho lớp học, sử dụng công nghệ WebRTC để kết nối giáo viên và học sinh trong thời gian thực với độ trễ thấp.

## 🚀 Cài Đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi động ứng dụng

#### Chế độ Development (Web)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:1420`

#### Chế độ Tauri (Desktop App)
```bash
npm run tauri dev
```

### 3. Khởi động Server Socket.IO (Nếu sử dụng chế độ Socket.IO)
Mở terminal mới và chạy:
```bash
cd server
npm install
node index.js
```
Server sẽ chạy tại port `3001`

## 📡 Hai Chế Độ Kết Nối

### 1. Socket.IO (LAN) - **Được Khuyến Nghị**
- ✅ **Ưu điểm**: 
  - Kết nối ổn định trong mạng LAN
  - Hỗ trợ nhiều học sinh cùng lúc
  - Quản lý kết nối tốt hơn
  - Hiển thị danh sách học sinh đã kết nối
  - Có thể tùy chỉnh server IP
  
- ⚠️ **Yêu cầu**: 
  - Server Socket.IO phải đang chạy
  - Tất cả máy phải trong cùng mạng LAN hoặc có thể kết nối đến server

- 📝 **Cách sử dụng**:
  1. Chọn "Socket.IO (LAN)" ở trang chủ
  2. **Giáo viên**: 
     - Nhập Server IP (mặc định: localhost)
     - Tạo ID phòng học (VD: `room-123`)
     - Nhấn "Tạo Phòng Học"
     - Nhấn "Bắt đầu giảng bài" để chia sẻ màn hình
     - Chia sẻ ID phòng cho học sinh
  3. **Học sinh**:
     - Nhập Server IP (cùng với giáo viên)
     - Nhập ID phòng học do giáo viên cung cấp
     - Nhấn "Tham gia"
     - Chờ giáo viên bắt đầu chia sẻ

### 2. PeerJS (P2P)
- ✅ **Ưu điểm**:
  - Không cần server riêng
  - Kết nối trực tiếp peer-to-peer
  - Có thể hoạt động qua internet
  
- ⚠️ **Hạn chế**:
  - Phụ thuộc vào PeerJS cloud server
  - Có thể gặp vấn đề với firewall/NAT
  
- 📝 **Cách sử dụng**:
  1. Chọn "PeerJS (P2P)" ở trang chủ
  2. **Giáo viên**:
     - Hệ thống tự động tạo ID lớp học (VD: `CLASS-X7Z4A2`)
     - Nhấn "Bắt đầu giảng bài" để chia sẻ màn hình
     - Sao chép và chia sẻ ID cho học sinh
  3. **Học sinh**:
     - Nhập ID lớp học do giáo viên cung cấp
     - Nhấn "Kết nối"

## 🎮 Các Tính Năng

### Giáo Viên
- ✅ Chia sẻ màn hình với chất lượng HD (1080p, 30fps)
- ✅ Bật/tắt âm thanh
- ✅ Xem trước màn hình đang chia sẻ
- ✅ Theo dõi số lượng học sinh đang xem
- ✅ Xem danh sách học sinh kết nối (Socket.IO)
- ✅ Thanh điều khiển nổi khi đang chia sẻ

### Học Sinh
- ✅ Xem màn hình giáo viên với độ trễ thấp
- ✅ Bật/tắt âm thanh
- ✅ Chế độ toàn màn hình
- ✅ Hiển thị trạng thái kết nối
- ✅ Thanh điều khiển nổi (ẩn/hiện khi di chuột)

## 🔧 Cấu Hình Server Socket.IO

### Chạy trên máy local
```javascript
// server/index.js
const io = new Server(3001, {
  cors: {
    origin: "*", // Cho phép tất cả origins
  },
});
```

### Lấy Local IP (macOS/Linux)
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Lấy Local IP (Windows)
```bash
ipconfig
```

Sau đó học sinh sử dụng IP này để kết nối (VD: `192.168.1.100`)

## 🐛 Xử Lý Sự Cố

### Không thể chia sẻ màn hình
- Đảm bảo trình duyệt có quyền truy cập màn hình
- Thử lại và chọn đúng màn hình/cửa sổ cần chia sẻ

### Học sinh không kết nối được (Socket.IO)
- Kiểm tra server Socket.IO đang chạy
- Đảm bảo Server IP đúng
- Kiểm tra firewall không chặn port 3001
- Đảm bảo cùng mạng LAN hoặc có thể truy cập server

### Học sinh không kết nối được (PeerJS)
- Kiểm tra kết nối internet
- Thử refresh trang và kết nối lại
- Đảm bảo ID lớp học chính xác

### Không có âm thanh
- Kiểm tra giáo viên đã bật âm thanh (biểu tượng Mic)
- Kiểm tra học sinh chưa tắt tiếng (biểu tượng Volume)
- Đảm bảo chia sẻ tab/cửa sổ có âm thanh

## 🏗️ Kiến Trúc Kỹ Thuật

### WebRTC với Socket.IO
```
Giáo viên                    Server Socket.IO              Học Sinh
   |                               |                           |
   |-- join-room ----------------->|                           |
   |                               |<-------- join-room -------|
   |                               |                           |
   |-- offer -------------------->|-------- offer ----------->|
   |                               |<------- answer -----------|
   |<-----------------------------|                           |
   |                               |                           |
   |<============== WebRTC Stream (P2P) =====================>|
```

### WebRTC với PeerJS
```
Giáo viên                    PeerJS Server                Học Sinh
   |                               |                           |
   |-- register ------------------>|                           |
   |                               |<-------- register --------|
   |                               |                           |
   |<============== WebRTC Stream (P2P via PeerJS) ===========>|
```

## 📦 Công Nghệ Sử Dụng

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Router**: React Router DOM
- **Icons**: Lucide React
- **WebRTC**: Native WebRTC API
- **Signaling**: Socket.IO hoặc PeerJS
- **Desktop**: Tauri 2.0
- **Build**: Vite

## 📝 Ghi Chú

- Chất lượng video phụ thuộc vào băng thông mạng
- Khuyến nghị sử dụng mạng LAN có dây cho kết quả tốt nhất
- Chế độ Socket.IO phù hợp cho lớp học trong phòng máy
- Chế độ PeerJS phù hợp cho học từ xa qua internet

## 🤝 Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Console log trong Developer Tools (F12)
2. Trạng thái kết nối hiển thị trên UI
3. Server logs (nếu dùng Socket.IO)

---

**ClassView Pro v1.0** - Powered by WebRTC 🚀
