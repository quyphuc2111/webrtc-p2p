# 🐛 Debug WebRTC - Học Sinh Không Thấy Màn Hình

## ✅ Đã Sửa

### Vấn Đề 1: Video không hiển thị dù đã "Đang học trực tuyến"
**Nguyên nhân**: 
- Video element bị ẩn do CSS `opacity-0 hidden`
- Autoplay bị block bởi browser policy
- Video không được force play

**Giải pháp**:
```typescript
// 1. Force play video khi nhận stream
pc.ontrack = (event) => {
  if (event.streams && event.streams[0]) {
    videoRef.current.srcObject = event.streams[0];
    // Force play
    videoRef.current.play().catch(err => {
      // Nếu autoplay bị block, mute và thử lại
      videoRef.current.muted = true;
      videoRef.current.play();
    });
  }
};

// 2. Thay đổi cách hiển thị video
{status === 'connected' && remoteStream ? (
  <div className="...">
    <video 
      autoPlay 
      playsInline 
      muted={isMuted}
      style={{ display: 'block' }}
    />
  </div>
) : null}
```

### Vấn Đề 2: CSS không load trong production
**Nguyên nhân**: Dùng Tailwind CDN không hoạt động trong build

**Giải pháp**: Cài đặt Tailwind CSS đúng cách
```bash
npm install -D tailwindcss@3.4.17 postcss autoprefixer
```

## 🔍 Cách Debug

### 1. Mở Developer Console (F12)

Kiểm tra các log sau:

#### Máy Giáo Viên:
```
✅ "My peer ID is: ..." hoặc "Joined room: ..."
✅ "Display media acquired: ..."
✅ "Student requesting stream..."
✅ "Sending offer to [student-id]"
✅ "Received answer from [student-id]"
✅ "ICE connection state: connected"
```

#### Máy Học Sinh:
```
✅ "Đã kết nối đến server"
✅ "Đã tham gia phòng: ..."
✅ "Received offer from [teacher-id]"
✅ "Sending answer to [teacher-id]"
✅ "Received track from [teacher-id]: video"
✅ "Setting remote stream from [teacher-id]"
✅ "ICE connection state: connected"
```

### 2. Kiểm tra Debug Info trên màn hình

Bây giờ màn hình học sinh có hiển thị debug info ở góc phải trên:
```
Status: connected
Stream: Active
Tracks: 2
Video: 1
Audio: 1
```

**Nếu thấy**:
- `Stream: None` → Chưa nhận được stream
- `Tracks: 0` → Stream không có tracks
- `Video: 0` → Không có video track

### 3. Kiểm tra WebRTC Stats

Mở Console và chạy:
```javascript
// Lấy tất cả peer connections
const pcs = Array.from(document.querySelectorAll('video'))
  .map(v => v.srcObject)
  .filter(s => s);

console.log('Streams:', pcs);
```

### 4. Kiểm tra Video Element

```javascript
const video = document.querySelector('video');
console.log('Video element:', {
  srcObject: video.srcObject,
  readyState: video.readyState,
  paused: video.paused,
  muted: video.muted,
  videoWidth: video.videoWidth,
  videoHeight: video.videoHeight
});
```

**readyState values**:
- 0 = HAVE_NOTHING
- 1 = HAVE_METADATA
- 2 = HAVE_CURRENT_DATA
- 3 = HAVE_FUTURE_DATA
- 4 = HAVE_ENOUGH_DATA ✅

## 🔧 Troubleshooting

### Vấn Đề: "Đang học trực tuyến" nhưng màn hình đen

#### Kiểm tra 1: Stream có tracks không?
```javascript
// Trong console
const video = document.querySelector('video');
const stream = video.srcObject;
console.log('Tracks:', stream?.getTracks());
console.log('Video tracks:', stream?.getVideoTracks());
```

**Nếu tracks = []**: Giáo viên chưa chia sẻ đúng hoặc tracks bị stop

#### Kiểm tra 2: Video có đang play không?
```javascript
const video = document.querySelector('video');
console.log('Paused:', video.paused);
console.log('ReadyState:', video.readyState);

// Thử force play
video.play().then(() => {
  console.log('Playing!');
}).catch(err => {
  console.error('Cannot play:', err);
});
```

#### Kiểm tra 3: ICE connection state
```javascript
// Xem trong console logs
// Tìm: "ICE connection state: ..."
```

**States**:
- `new` → Mới tạo
- `checking` → Đang kiểm tra
- `connected` → Đã kết nối ✅
- `completed` → Hoàn tất ✅
- `failed` → Thất bại ❌
- `disconnected` → Mất kết nối ❌
- `closed` → Đã đóng ❌

### Vấn Đề: ICE connection failed

**Nguyên nhân**: Không thể thiết lập P2P connection

**Giải pháp**:
1. Kiểm tra cùng mạng LAN
2. Kiểm tra firewall
3. Thử thêm STUN/TURN servers:

```typescript
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
});
```

### Vấn Đề: Không nhận được offer từ giáo viên

**Kiểm tra**:
1. Giáo viên đã bắt đầu chia sẻ chưa?
2. Cùng Room ID không?
3. Socket.IO server đang chạy?

```bash
# Test kết nối socket
curl http://[teacher-ip]:3001/socket.io/
```

### Vấn Đề: Video bị lag/giật

**Giải pháp**:
1. Giảm chất lượng video (từ 1080p xuống 720p)
2. Giảm frame rate (từ 30fps xuống 24fps)
3. Kiểm tra băng thông mạng

```typescript
// Trong TeacherDashboardSocketIO.tsx
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    width: { ideal: 1280 },  // 720p
    height: { ideal: 720 },
    frameRate: { ideal: 24 }
  },
  audio: true,
});
```

## 📊 Network Analysis

### Kiểm tra băng thông
```bash
# Ping giữa 2 máy
ping [teacher-ip]

# Test tốc độ
iperf3 -s  # Trên máy giáo viên
iperf3 -c [teacher-ip]  # Trên máy học sinh
```

### Kiểm tra Socket.IO connection
```javascript
// Trong console
const socket = io.connect('http://[teacher-ip]:3001');
socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

## ✅ Checklist Hoàn Chỉnh

### Máy Giáo Viên:
- [ ] Server Socket.IO đang chạy (`node server/index.js`)
- [ ] Đã tạo Room ID
- [ ] Đã bắt đầu chia sẻ màn hình
- [ ] Console log: "Display media acquired"
- [ ] Console log: "Student requesting stream"
- [ ] Console log: "ICE connection state: connected"

### Máy Học Sinh:
- [ ] Nhập đúng Server IP
- [ ] Nhập đúng Room ID
- [ ] Console log: "Đã kết nối đến server"
- [ ] Console log: "Received offer"
- [ ] Console log: "Received track: video"
- [ ] Console log: "ICE connection state: connected"
- [ ] Debug info hiển thị: Stream: Active, Video: 1
- [ ] Video element có srcObject
- [ ] Video đang play (paused = false)

## 🎯 Quick Fix Commands

```bash
# Restart dev server
npm run dev

# Clear cache và rebuild
rm -rf node_modules dist
npm install
npm run build

# Test local build
npm run preview
```

## 📞 Nếu Vẫn Không Được

1. **Mở F12 Console** trên cả 2 máy
2. **Copy tất cả logs** và gửi cho dev
3. **Chụp màn hình** debug info
4. **Kiểm tra Network tab** trong DevTools

---

**Updated**: 2026-01-20
