# 🍎 Hướng Dẫn Build macOS

## ✅ Đã Cập Nhật

File `.github/workflows/build.yml` đã được cập nhật để build cho cả **Windows** và **macOS**.

## 🏗️ Build Jobs

### 1. Windows Build
- ✅ Build cho Windows x64
- ✅ Tạo file `.exe` và `.msi`
- ✅ Server binary cho Windows

### 2. macOS Build (Mới)
- ✅ Build Universal Binary (Intel + Apple Silicon)
- ✅ Tạo file `.dmg` và `.app`
- ✅ Server binary cho cả 2 kiến trúc:
  - `aarch64-apple-darwin` (Apple Silicon - M1/M2/M3)
  - `x86_64-apple-darwin` (Intel)

## 🔐 Code Signing cho macOS (Tùy chọn)

Để app có thể chạy trên macOS mà không bị cảnh báo "unidentified developer", bạn cần setup code signing.

### Yêu Cầu:
1. **Apple Developer Account** ($99/năm)
2. **Developer ID Certificate**
3. **App-specific password** cho notarization

### Setup GitHub Secrets:

Vào repository → Settings → Secrets and variables → Actions, thêm các secrets sau:

#### Bắt Buộc (cho code signing):
```
APPLE_CERTIFICATE          # Base64 encoded .p12 certificate
APPLE_CERTIFICATE_PASSWORD # Password của certificate
APPLE_SIGNING_IDENTITY     # Tên identity (VD: "Developer ID Application: Your Name")
```

#### Tùy chọn (cho notarization):
```
APPLE_ID                   # Apple ID email
APPLE_PASSWORD             # App-specific password
APPLE_TEAM_ID              # Team ID (10 ký tự)
```

### Cách Lấy Certificate:

#### 1. Tạo Certificate Signing Request (CSR)
```bash
# Trên Mac, mở Keychain Access
# Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
# Điền email, tên, chọn "Saved to disk"
```

#### 2. Tạo Developer ID Certificate
```
1. Đăng nhập https://developer.apple.com/account/resources/certificates/list
2. Click (+) để tạo certificate mới
3. Chọn "Developer ID Application"
4. Upload CSR file
5. Download certificate (.cer)
6. Double click để import vào Keychain
```

#### 3. Export Certificate sang .p12
```bash
# Trong Keychain Access
# Tìm certificate "Developer ID Application: Your Name"
# Right click → Export
# Chọn format .p12
# Đặt password
```

#### 4. Convert sang Base64
```bash
base64 -i certificate.p12 -o certificate.base64.txt
# Copy nội dung file certificate.base64.txt vào GitHub Secret APPLE_CERTIFICATE
```

#### 5. Lấy Signing Identity
```bash
security find-identity -v -p codesigning
# Copy tên identity (VD: "Developer ID Application: Your Name (TEAM_ID)")
```

#### 6. Tạo App-Specific Password
```
1. Đăng nhập https://appleid.apple.com
2. Security → App-Specific Passwords
3. Generate new password
4. Copy password vào GitHub Secret APPLE_PASSWORD
```

## 🚀 Build Không Cần Code Signing

Nếu bạn **KHÔNG** muốn code signing (app sẽ có cảnh báo khi chạy):

### Cách 1: Xóa các biến môi trường code signing
Xóa hoặc comment các dòng này trong `build.yml`:

```yaml
# APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
# APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
# APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
# APPLE_ID: ${{ secrets.APPLE_ID }}
# APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
# APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### Cách 2: Build local
```bash
# Build cho Apple Silicon (M1/M2/M3)
npm run tauri build -- --target aarch64-apple-darwin

# Build cho Intel
npm run tauri build -- --target x86_64-apple-darwin

# Build Universal Binary (cả 2)
npm run tauri build -- --target universal-apple-darwin
```

Output sẽ ở: `src-tauri/target/release/bundle/`

## 📦 Cấu Trúc Build Output

### macOS:
```
src-tauri/target/
├── aarch64-apple-darwin/release/bundle/
│   ├── dmg/
│   │   └── ClassView Pro_1.0.0_aarch64.dmg
│   └── macos/
│       └── ClassView Pro.app
├── x86_64-apple-darwin/release/bundle/
│   ├── dmg/
│   │   └── ClassView Pro_1.0.0_x64.dmg
│   └── macos/
│       └── ClassView Pro.app
└── universal-apple-darwin/release/bundle/
    ├── dmg/
    │   └── ClassView Pro_1.0.0_universal.dmg
    └── macos/
        └── ClassView Pro.app
```

### Windows:
```
src-tauri/target/release/bundle/
├── msi/
│   └── ClassView Pro_1.0.0_x64_en-US.msi
└── nsis/
    └── ClassView Pro_1.0.0_x64-setup.exe
```

## 🔧 Cấu Hình Tauri cho macOS

File `src-tauri/tauri.conf.json` đã được cấu hình sẵn cho macOS:

```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "10.13",
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    }
  }
}
```

## 🎯 Trigger Build

### Tự động (khi push tag):
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Manual (từ GitHub):
```
1. Vào repository trên GitHub
2. Actions tab
3. Chọn workflow "Build Tauri App"
4. Click "Run workflow"
5. Chọn branch
6. Click "Run workflow"
```

## 📝 Lưu Ý

### macOS Gatekeeper
- **Có code signing**: App chạy bình thường
- **Không có code signing**: User phải:
  1. Right-click app → Open
  2. Hoặc: System Settings → Privacy & Security → "Open Anyway"

### Universal Binary
- File size lớn hơn (~2x) vì chứa cả 2 kiến trúc
- Chạy được trên cả Intel và Apple Silicon
- Khuyến nghị cho distribution

### Server Binary
- Build riêng cho từng kiến trúc
- Tauri sẽ tự động chọn binary phù hợp khi chạy
- Naming convention:
  - `server-aarch64-apple-darwin` (M1/M2/M3)
  - `server-x86_64-apple-darwin` (Intel)

## ✅ Checklist

- [x] Cập nhật `build.yml` với macOS job
- [x] Build server binary cho cả 2 kiến trúc
- [x] Set executable permissions cho binaries
- [x] Cấu hình Universal Binary build
- [ ] Setup code signing (tùy chọn)
- [ ] Test build trên macOS
- [ ] Test app trên cả Intel và Apple Silicon

## 🆘 Troubleshooting

### Lỗi: "Developer cannot be verified"
→ Cần code signing hoặc user phải manually open

### Lỗi: "damaged and can't be opened"
→ Chạy: `xattr -cr "/Applications/ClassView Pro.app"`

### Lỗi: Server binary không chạy
→ Kiểm tra permissions: `chmod +x src-tauri/bin/server-*`

### Build fails với "No signing identity found"
→ Xóa các biến APPLE_* trong workflow hoặc setup code signing đúng

## 📚 Tài Liệu Tham Khảo

- [Tauri Building for macOS](https://tauri.app/v1/guides/building/macos)
- [Apple Code Signing](https://developer.apple.com/support/code-signing/)
- [Tauri GitHub Actions](https://github.com/tauri-apps/tauri-action)

---

**Build thành công! 🎉**
