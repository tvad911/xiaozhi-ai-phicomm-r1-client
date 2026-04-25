# SYSTEM BLUEPRINT & CONTEXT: XIAOZHI AI CLIENT FOR PHICOMM R1

## 1. PROJECT OVERVIEW
- **Objective:** Xây dựng một Headless Android App (Background Service) làm Client giao tiếp thời gian thực với hệ sinh thái Xiaozhi AI cho loa thông minh.
- **Target Device (Production):** Phicomm R1 (HĐH Android 5.1.1 - API 22, CPU 32-bit `armeabi-v7a`, RAM 512MB, đã Root, Không màn hình).
- **Testing Device (Development):** Smartphone hiện đại (HĐH Android 14+ - API 34+, CPU 64-bit `arm64-v8a`, Không Root, Có màn hình).
- **Core Principle:** Code 1 lần. Chạy test và debug hoàn chỉnh trên Android 14. Build APK đẩy thẳng vào loa Android 5.1 chạy mượt mà không cần sửa chữa.

## 2. STRICT TECHNICAL CONSTRAINTS (CRITICAL FOR AI CODER)
You MUST adhere to these rules to prevent crashes on API 22:
- **SDK Target:** `minSdkVersion 22`, `targetSdkVersion 34`.
- **NDK (C++):** Phải build thư viện JNI cho cả 2 kiến trúc. Khai báo trong `build.gradle`: `ndk { abiFilters 'armeabi-v7a', 'arm64-v8a' }`.
- **Networking Library:** **BẮT BUỘC dùng `OkHttp 3.12.x`** (Bản cuối cùng hỗ trợ Android 5). TUYỆT ĐỐI KHÔNG dùng OkHttp 4+.
- **Web Server:** Tích hợp `NanoHTTPD` chạy ở port `8080`. Bắt buộc thêm `android:usesCleartextTraffic="true"` vào Manifest.
- **Audio API:** **BẮT BUỘC dùng Constructor kiểu cũ** để khởi tạo `AudioRecord` và `AudioTrack`. TUYỆT ĐỐI KHÔNG dùng cú pháp `.Builder()` (Sẽ văng lỗi `NoSuchMethodError` trên API 22).

## 3. CORE ARCHITECTURE MODULES
1. **Audio Engine (Streaming & Processing):**
   - **KWS (Wake-word):** Engine C++ (Snowboy/Porcupine) quét từ khóa offline qua JNI.
   - **VAD (Voice Activity Detection):** Dùng WebRTC VAD. Tự động ngắt mic chốt câu lệnh khi người dùng im lặng > 1.2s.
   - **Full-Duplex I/O:** Thu raw PCM qua mic và đẩy lên WebSocket. Nhận Audio Chunk (TTS) từ WebSocket ghi thẳng vào `AudioTrack.write()`.
   - **Chống Memory Leak (OOM):** RAM của loa rất nhỏ. Phải cấp phát tĩnh mảng `byte[]` (Byte Pool) ngoài vòng lặp khi đọc/ghi audio. Không khởi tạo `new byte[]` liên tục gây giật lag do Garbage Collection.
2. **Hardware Manager (Root):**
   - Đổi màu đèn LED bằng lệnh Shell: `su -c "echo [color_code] > /sys/class/leds/..."`.
   - Bắt sự kiện phím bấm vật lý qua `/dev/input`.

## 4. PROVISIONING & AUTHENTICATION FLOW (STATE MACHINE)
Luồng Setup được quản lý tập trung bằng Enum State Machine. Thông báo cho user qua màu đèn LED và Audio Offline (dùng `MediaPlayer` phát các file .mp3 nạp sẵn trong `res/raw/`).

- **STATE_BOOT (Khởi động ngầm):**
  - Quét `SharedPreferences`. Đã có WiFi + Token -> Nhảy sang `STATE_READY`. Có WiFi, thiếu Token -> Nhảy sang `STATE_REQUEST_AUTH`. Không có WiFi -> Nhảy sang `STATE_NO_NETWORK`.
- **STATE_NO_NETWORK (SoftAP / Captive Portal):**
  - Loa tự phát WiFi Hotspot (`Xiaozhi_R1_[MAC]`). Đèn LED chớp **CAM**.
  - Bật `NanoHTTPD`. User vào `192.168.43.1:8080` nhập SSID/Pass WiFi nhà & URL Server. Lưu và kết nối.
- **STATE_REQUEST_AUTH:**
  - Gửi `Device_ID` (MAC Address) lên Server lấy Token.
  - Server báo `unbound` và trả về mã PIN 6 số (VD: `827359`).
- **STATE_WAIT_BIND (Broadcast & Polling):**
  - Đèn LED chớp **TÍM**.
  - Loa phát audio ghép đọc mã PIN (VD: `intro.mp3` + `8.mp3`...`9.mp3`), lặp lại mỗi 30s.
  - App chạy HTTP Polling ngầm mỗi 3-5s (Dùng `Handler` hoặc `ScheduledExecutorService`, TUYỆT ĐỐI KHÔNG dùng `Thread.sleep`) để check xem user đã nhập mã trên Web Xiaozhi chưa. Nhận `Access_Token` thành công -> `STATE_READY`.
- **STATE_READY:** Đèn LED **XANH LÁ** 2s rồi tắt. Bật WSS, gọi KWS thu âm.
- **HARD RESET (Ngoại lệ):** Nhấn giữ phím vật lý 7s -> Xóa sạch AppData -> Khởi động lại vòng lặp về `STATE_NO_NETWORK`.

## 5. CROSS-VERSION COMPATIBILITY RULES (API 22 vs API 34)
Luôn luôn rẽ nhánh logic dựa trên `Build.VERSION.SDK_INT` để đảm bảo code chạy được trên cả ĐT test và Loa thực tế:

1. **Lỗi SSL Handshake (Trí mạng):** Android 5.1 đã hết hạn Root CAs. Phải viết một `Custom TrustManager` (Trust All Certs) áp dụng cho OkHttp 3.12 để Bypass chứng chỉ SSL nếu chạy trên thiết bị API <= 22.
2. **Background Services & Permissions:**
   - `API >= 26` (Điện thoại): Xin quyền Mic Runtime. Dùng `startForegroundService` với Notification cố định.
   - `API <= 22` (Loa R1): Cấp quyền lúc cài. Dùng `startService` chạy ngầm tĩnh lặng.
3. **MAC Address Fingerprint (Device ID):**
   - `API <= 22` (Loa R1): Gọi `WifiManager.getConnectionInfo().getMacAddress()` để lấy MAC thật.
   - `API >= 23` (Điện thoại): Google đã ẩn MAC. Phải trả về một chuỗi String giả (VD: `TEST_PHONE_MAC_14`) để làm ID.
4. **Hardware Mocking / AEC:**
   - Tạo cờ: `boolean isR1Speaker = Build.VERSION.SDK_INT <= 22;`
   - **Đèn LED:** Nếu `true` -> Chạy lệnh Root Shell vật lý. Nếu `false` -> Ghi LogCat hoặc Update UI hiển thị màu trên ĐT.
   - **AEC:** Khi khởi tạo `AudioRecord`, tham số `AudioSource` LUÔN LUÔN là `VOICE_COMMUNICATION` để ép Loa R1 bật tính năng Khử tiếng vang bằng phần cứng.