# Kế Hoạch & Quy Tắc Xây Dựng Ứng Dụng Xiaozhi Client Cho Loa Phicomm R1

**Bối cảnh phần cứng thiết bị:**
- **Vi xử lý:** Rockchip RK3229.
- **RAM:** 512MB (Yêu cầu tối ưu bộ nhớ khắt khe).
- **Hệ điều hành:** Android 5.1 (API Level 22).
- **Đặc thù:** Không có màn hình (Headless), mic array, tích hợp phím cứng và LED.

---

## 1. Quy Tắc Môi Trường Build (Build Environment Rules)

- **SDK Version:**
  - `minSdkVersion`: 21 hoặc 22.
  - `targetSdkVersion`: Tối đa 28 (để tránh rắc rối với các chính sách background service/permission của Android đời cao).
- **Giao diện (UI):** - Không sử dụng các framework UI nặng (ví dụ: Jetpack Compose). 
  - Ưu tiên ứng dụng rỗng (Headless) hoặc chỉ dùng Android View cơ bản nhất cho mục đích debug.
- **Thư viện bên thứ 3 (Dependencies):** - Hạn chế tối đa việc sử dụng thư viện ngoài.
  - Phải kiểm tra khả năng tương thích ngược của thư viện với Android 5.0+.

## 2. Quy Tắc Vận Hành Hệ Thống (System Operation Rules)

- **Kiến trúc hướng Dịch vụ (Service-Based):** Toàn bộ logic thu phát âm thanh và giao tiếp mạng phải nằm trong một `Service` (ưu tiên `Foreground Service` với thông báo ẩn) để tránh bị hệ thống tắt nền.
- **Tự động khởi động (Auto-Start):** - Phải có `BroadcastReceiver` lắng nghe `android.intent.action.BOOT_COMPLETED`.
  - Đảm bảo app tự chạy ngầm ngay khi cắm điện khởi động loa.
- **Quản lý RAM (Memory Optimization):**
  - Tránh rò rỉ bộ nhớ (Memory Leak).
  - Stream dữ liệu mạng/âm thanh theo từng chunk (mảnh) nhỏ thay vì lưu trữ mảng byte lớn trong bộ nhớ.

## 3. Quy Tắc Xử Lý Âm Thanh (Audio Processing Rules)

- **Thu âm (Recording):**
  - Dùng `AudioRecord` thay vì `MediaRecorder` để lấy Raw PCM.
  - Format chuẩn: `16000Hz`, `Mono`, `16-bit PCM`.
  - Test kỹ các tùy chọn `AudioSource` (`MIC`, `VOICE_RECOGNITION`, `VOICE_COMMUNICATION`) để tìm luồng thu tối ưu nhất với cụm Mic-array của R1.
- **Phát âm thanh (Playback):**
  - Sử dụng `AudioTrack` để phát luồng TTS trả về từ Server.
- **Quản lý luồng âm thanh (Audio Focus):**
  - App phải biết tự nhường quyền (Duck/Pause) khi người dùng ra lệnh (mic kích hoạt) và loa đang phát nhạc.

## 4. Quy Tắc Mạng & Giao Tiếp (Networking Rules)

- **Giao thức:** Sử dụng `WebSocket` (Full-duplex) để stream voice real-time.
- **Xử lý TLS/SSL cho Android 5.1:** - Android 5.1 gặp lỗi với các chuẩn bảo mật hiện đại.
  - **Bắt buộc:** Downgrade thư viện mạng (ví dụ dùng `OkHttp 3.12.x`) hoặc tự viết custom `SSLSocketFactory` để ép kích hoạt `TLS 1.2` nếu server dùng HTTPS/WSS.
- **Cơ chế tự phục hồi (Resilience):** - Thiết lập vòng lặp kết nối lại (Auto-reconnect) với thuật toán Exponential Backoff khi rớt mạng Wi-Fi, đảm bảo app không bị crash.

## 5. Quy Tắc Giao Tiếp Phần Cứng (Hardware I/O Rules)

- **Phím cứng (Physical Buttons):** - Lắng nghe `KeyEvent` từ mặt trên của loa.
  - Gán nút Action (hoặc Play/Pause) làm nút chức năng "Đánh thức/Ngắt thu âm" khẩn cấp (Manual Wake-up).
- **Phản hồi bằng Đèn LED (Tùy chọn):** - Tương tác với driver LED (thường nằm ở `/sys/class/leds/`) để phản hồi trạng thái: Đang nghe (Xanh), Đang xử lý (Chớp nháy), Mất kết nối (Đỏ).