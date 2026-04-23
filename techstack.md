# Phương án Kiến trúc Ứng dụng (APK) cho Phicomm R1

## 1. Đặc điểm phần cứng Phicomm R1

| Thông số | Giá trị |
| :--- | :--- |
| **OS** | Android 5.1 / 6.0 (Custom ROM, **không có** Google Play Services) |
| **Processor** | ARM (armeabi-v7a, arm64-v8a) |
| **RAM** | ~1 GB |
| **Root** | Có thể root (cần cho LED control, silent OTA install) |
| **Màn hình** | **Không có** (Headless) |
| **Kết nối** | WiFi 2.4/5G, Bluetooth Classic + BLE, USB Type-C |
| **Phần cứng đặc biệt** | Mảng Mic, Loa tích hợp, LED Ring, Nút vật lý trên đỉnh |

Ứng dụng cài trên loa sẽ không có giao diện hiển thị trực tiếp mà hoạt động dưới dạng **Foreground Service** (dịch vụ chạy ngầm với notification cố định) kết hợp với một **Embedded Web Server** (NanoHTTPD) để phơi bày giao diện điều khiển ra các thiết bị khác cùng mạng WiFi.

## 2. Có cần chuyển đổi code hiện tại sang ngôn ngữ khác không?

**CÓ VÀ KHÔNG — Sử dụng mô hình Hybrid.**

Source code hiện tại là một Web App hoàn chỉnh (React/Vite cho Frontend, Express/Node.js cho Backend). Phần giao diện giữ nguyên, phần backend **bắt buộc viết lại bằng Kotlin Native Android**.

### A. Phần Frontend (React/Vite): GIỮ NGUYÊN
- **Không chuyển đổi** sang Kotlin, Java hay React Native.
- Chạy `npm run build` → ra thư mục `dist/` chứa HTML/CSS/JS tĩnh.
- Đóng vai trò **Web Admin Portal**: người dùng truy cập `http://<IP-loa>:8081` từ điện thoại/laptop.
- **Thay đổi duy nhất:** refactor mock data → thành `fetch()` calls đến API thật.

### B. Phần Backend (`server.ts`): VIẾT LẠI BẰNG KOTLIN ANDROID NATIVE
- Node.js không thể điều khiển trực tiếp phần cứng Android (Mic, LED, BT, WiFi) → hiệu năng kém, không ổn định.
- **Giải pháp:** Tạo Android App (Kotlin) chạy Foreground Service, nhúng NanoHTTPD làm Web Server nội bộ.

### C. Phần AI (Google Gemini): CHUYỂN SANG SERVER-SIDE
- Hiện tại `App.tsx` gọi Gemini trực tiếp từ browser bằng `@google/genai` + API key inject qua Vite.
- **Vấn đề bảo mật:** API key sẽ bị lộ ra client-side.
- **Giải pháp:** API key lưu trong Android `SharedPreferences`. Kotlin backend proxy request AI qua endpoint `/api/chat`. Frontend gọi endpoint này thay vì gọi Gemini trực tiếp.

## 3. Kiến trúc hệ thống đề xuất

```
┌─────────────────────────────────────────────────────────┐
│  Phicomm R1 Hardware (Android 5.1/6.0)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  com.xiaozhi.r1 (APK - Foreground Service)         │ │
│  │  ┌───────────┐ ┌────────────┐ ┌──────────────────┐ │ │
│  │  │ MainService│ │NanoHTTPD   │ │ Hardware Managers│ │ │
│  │  │ (Singleton)│ │ :8081      │ │ - LedManager     │ │ │
│  │  │            │ │ ├─/api/*   │ │ - AudioManager   │ │ │
│  │  │            │ │ ├─/static  │ │ - BluetoothMgr   │ │ │
│  │  │            │ │ └─WebSocket│ │ - WifiManager     │ │ │
│  │  └───────────┘ └────────────┘ │ - MusicPlayer     │ │ │
│  │                                │ - OtaManager      │ │ │
│  │  ┌───────────────────────┐    └──────────────────┘ │ │
│  │  │  assets/web/          │                          │ │
│  │  │  (React dist/ output) │◄─── npm run build        │ │
│  │  │  index.html, *.js, …  │                          │ │
│  │  └───────────────────────┘                          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲
         │ HTTP :8081         │ mDNS (xiaozhi-r1.local)
         │                    │
┌────────┴────────────────────┴──────────────────────────┐
│  User's Phone / Laptop / Tablet (Browser)              │
│  Opens http://192.168.x.x:8081 → React Web Admin      │
└────────────────────────────────────────────────────────┘
```

## 4. Tech Stack chi tiết cho Android APK

| Thành phần | Công nghệ | Lý do chọn |
| :--- | :--- | :--- |
| **Ngôn ngữ** | Kotlin 1.9.21 | Tiêu chuẩn Android, tương thích min SDK 21 |
| **Build System** | Gradle 8.5 + AGP 8.2.0 | Hỗ trợ Java 17/21, Kotlin DSL |
| **Web Server** | NanoHTTPD 2.3.1 | Siêu nhẹ (~30KB), không cần coroutine, tương thích API 21. (**Không dùng Ktor** vì Ktor-Server yêu cầu coroutine nặng và API cao hơn) |
| **Audio Codec** | Opus (JNI/C++) | Codec giọng nói tối ưu cho WebSocket streaming |
| **Media Player** | Media3 ExoPlayer 1.2.1 | Hỗ trợ streaming URL, playlist, metadata |
| **Networking** | OkHttp 4.12.0 | WebSocket, HTTP client, download OTA |
| **JSON** | Gson 2.10.1 | Nhẹ, tương thích Java 8+ |
| **mDNS** | Android NSD Manager | Quảng bá `xiaozhi-r1.local` cho dễ truy cập |
| **Compile SDK** | 34 | |
| **Target SDK** | 30 | Cân bằng giữa legacy và modern |
| **Min SDK** | 21 (Android 5.0) | Tương thích Phicomm R1 |

## 5. Lộ trình triển khai (Tổng quan)

| Phase | Mô tả | Output |
| :--- | :--- | :--- |
| **Phase 1** | Refactor React: Tách mock data → API hooks | Codebase React sẵn sàng gọi API thật |
| **Phase 2** | Dựng khung Android: Foreground Service + NanoHTTPD + mDNS | APK trống serve được `index.html` |
| **Phase 3** | Implement Hardware APIs: WiFi, BT, LED, Audio, EQ | Các endpoint `/api/*` hoạt động thật |
| **Phase 4** | Tích hợp AI: Gemini proxy, Chat history, System Prompt | `/api/chat` hoạt động end-to-end |
| **Phase 5** | Media Player: ExoPlayer + Piped streaming + Queue | Phát nhạc YouTube/SoundCloud/Zing |
| **Phase 6** | Advanced: Smart Home (MQTT), Alarms, Timers, OTA, Casting | Đầy đủ tính năng |
| **Phase 7** | Build, Test, Deploy | File `.apk` cài được lên R1 |

---
> **Xem chi tiết từng bước triển khai trong [plan.md](./plan.md).**
