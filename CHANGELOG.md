# 📝 Changelog - ClassView Pro

## [0.1.0] - 2026-01-20

### ✅ Fixed

#### Video Playback Issue
- **Problem**: Học sinh kết nối thành công (status = 'connected') nhưng không thấy video
- **Root Cause**: Video element không tự động play sau khi nhận stream
- **Solution**: 
  - Thêm `setTimeout(100ms)` để đảm bảo video element đã render
  - Force call `video.play()` sau khi set `srcObject`
  - Fallback to muted playback nếu autoplay bị block
  - Áp dụng cho cả Socket.IO và PeerJS mode

#### CSS Not Loading in Production
- **Problem**: Build production không có CSS
- **Root Cause**: Dùng Tailwind CDN không hoạt động trong build
- **Solution**:
  - Cài đặt Tailwind CSS v3.4.17 đúng cách
  - Cấu hình PostCSS và Tailwind config
  - CSS file size: 24.45 kB (compressed: 5.03 kB)

#### macOS Build in GitHub Actions
- **Problem**: Không build được .dmg file
- **Root Cause**: Code signing secrets gây lỗi khi chưa setup
- **Solution**: 
  - Xóa các biến môi trường code signing không bắt buộc
  - Build vẫn thành công, chỉ không có signature
  - User cần right-click → Open lần đầu

### 🎨 Added

#### Debug Features
- Thêm debug info panel ở góc phải trên màn hình học sinh:
  - Status (connected/connecting/disconnected)
  - Stream state (Active/None)
  - Number of tracks
  - Video tracks count
  - Audio tracks count
  - Video paused state
  - Video ready state (0-4)
  - Video dimensions
- Thêm nút "🔄 Force Play" để debug
- Console logs chi tiết cho WebRTC connection

#### Documentation
- `DEBUG_WEBRTC.md` - Hướng dẫn debug chi tiết
- `MACOS_BUILD_GUIDE.md` - Hướng dẫn build cho macOS
- `CLASSVIEW_PRO_GUIDE.md` - Hướng dẫn sử dụng
- `INTEGRATION_SUMMARY.md` - Tóm tắt tích hợp
- `CHANGELOG.md` - File này

### 🔧 Improved

#### Tauri Configuration
- Tăng kích thước cửa sổ mặc định: 1400x900
- Thêm minWidth/minHeight: 1024x768
- Cập nhật product name: "ClassView Pro"
- Thêm `dangerousDisableAssetCspModification: true` cho WebRTC
- Cấu hình macOS bundle settings

#### Video Element
- Thêm `style={{ display: 'block' }}` để force hiển thị
- Thêm `muted={isMuted}` sync với state
- Thêm `controls={false}` để ẩn controls
- Background đen cho video container

#### Connection Flow
- Render video element ngay khi status = 'connected'
- Không cần đợi remoteStream state update
- Tự động retry play nếu bị block

### 🏗️ Technical

#### Dependencies
```json
{
  "tailwindcss": "3.4.17",
  "postcss": "latest",
  "autoprefixer": "latest",
  "lucide-react": "^0.562.0",
  "react-router-dom": "^7.12.0"
}
```

#### Build Configuration
- Tailwind CSS v3 với PostCSS
- Vite 7.3.0
- TypeScript 5.8.3
- React 19.1.0

#### GitHub Actions
- Build cho Windows (x64)
- Build cho macOS (Universal Binary - Intel + Apple Silicon)
- Parallel builds
- Auto release với artifacts

### 📊 Performance

#### Video Quality
- Default: 1080p @ 30fps
- Configurable trong code
- WebRTC P2P connection (độ trễ thấp)

#### Build Size
- CSS: 24.45 kB (gzipped: 5.03 kB)
- JS: 316.73 kB (gzipped: 99.20 kB)
- Total: ~341 kB

### 🐛 Known Issues

1. **Audio Track**: Giáo viên cần tick "Share audio" khi chia sẻ màn hình
2. **First Time Open (macOS)**: User cần right-click → Open nếu không có code signing
3. **Autoplay Policy**: Một số browser có thể block autoplay, video sẽ tự động mute

### 🔜 Future Improvements

- [ ] Thêm chat feature
- [ ] File transfer
- [ ] Recording
- [ ] Multiple quality options (720p/1080p/4K)
- [ ] TURN server support cho NAT traversal
- [ ] Mobile responsive
- [ ] Dark/Light theme toggle
- [ ] Multi-language support

### 🙏 Credits

- WebRTC for real-time communication
- Socket.IO for signaling
- PeerJS for simplified P2P
- Tauri for desktop app
- Tailwind CSS for styling
- Lucide React for icons

---

**Version**: 0.1.0  
**Release Date**: 2026-01-20  
**Status**: Beta - Ready for testing
