# Kế hoạch Sửa lỗi & Bổ sung Logic — Xiaozhi Phicomm R1

> Tài liệu này liệt kê **tất cả các logic còn thiếu** so với thiết kế (`plan.md`) và kiến trúc (KI),
> chia nhỏ theo từng bước để tiện cập nhật dần. Đánh dấu checkbox `[x]` khi hoàn thành.

---

## Mục lục

| # | Nhóm | Độ ưu tiên |
|---|------|------------|
| A | [CrashLogger — Hệ thống Log](#a-crashlogger--hệ-thống-log) | 🔴 Cao |
| B | [API `/api/logs` — Expose log cho Web UI](#b-api-apilogs--expose-log-cho-web-ui) | 🔴 Cao |
| C | [API `/api/ota/upload` — Upload APK qua Web](#c-api-apiotaupload--upload-apk-qua-web) | 🔴 Cao |
| D | [API `/api/console/send` — Text Injection](#d-api-apiconsolesend--text-injection) | 🟡 Trung bình |
| E | [DeviceManager — Định danh & Cloud Sync](#e-devicemanager--định-danh--cloud-sync) | 🟡 Trung bình |
| F | [Physical Button Handling](#f-physical-button-handling) | 🟡 Trung bình |
| G | [MainService — Thiếu init LedManager & AudioManager](#g-mainservice--thiếu-init-ledmanager--audiomanager) | 🔴 Cao |
| H | [API thiếu trong ApiHandler — LED, EQ, Volume, Alarm, Timer, Casting](#h-api-thiếu-trong-apihandler) | 🟡 Trung bình |
| I | [WebSocketProtocol — Thiếu Reconnect Logic](#i-websocketprotocol--thiếu-reconnect-logic) | 🟡 Trung bình |
| J | [SmartHomeManager — MQTT thực tế](#j-smarthomemanager--mqtt-thực-tế) | 🟢 Thấp |
| K | [Voiceprints Management](#k-voiceprints-management) | 🟢 Thấp |

---

## A. CrashLogger — Hệ thống Log

**Vấn đề:** Không có file `CrashLogger.kt`. Hệ thống không có cơ chế thu thập log để debug từ xa qua Web UI.

**Giải pháp:** Tạo class `CrashLogger` với ring-buffer lưu log trên RAM (giới hạn ~500 dòng), cung cấp method `getLogs()`.

### Các bước:

- [ ] **A1.** Tạo file `util/CrashLogger.kt`
  - Singleton object (companion `instance`).
  - Sử dụng `LinkedList<LogEntry>` hoặc `ArrayDeque` làm ring-buffer (max 500 entries).
  - Data class `LogEntry(timestamp: Long, level: String, tag: String, message: String)`.
  - Methods: `log(level, tag, message)`, `i(tag, msg)`, `w(tag, msg)`, `e(tag, msg)`, `getLogs(): List<LogEntry>`, `clear()`.
  - Thread-safe với `synchronized` block.

- [ ] **A2.** Tích hợp `CrashLogger` vào `MainService.kt`
  - Gọi `CrashLogger.i("MainService", "Service started")` tại `onCreate()`.
  - Gọi log tại các điểm quan trọng: WebServer start, NSD register, mode apply, v.v.

- [ ] **A3.** Tích hợp `CrashLogger` vào các Manager khác (tùy chọn)
  - Thay thế một số `Log.d/Log.e` bằng `CrashLogger.d/CrashLogger.e` ở `SmartHomeManager`, `OtaManager`, `WebSocketProtocol` để thu thập log hữu ích hơn.

---

## B. API `/api/logs` — Expose log cho Web UI

**Vấn đề:** Web UI cần hiển thị log để debug từ xa, nhưng ApiHandler chưa có endpoint này.

**Giải pháp:** Thêm route `/api/logs` vào `ApiHandler.kt`.

### Các bước:

- [ ] **B1.** Thêm route `GET /api/logs` vào block `when` trong `handleRequest()`
  - Response: `CrashLogger.getLogs()` serialize bằng Gson.

- [ ] **B2.** Thêm route `POST /api/logs/clear` (tùy chọn)
  - Gọi `CrashLogger.clear()`.

---

## C. API `/api/ota/upload` — Upload APK qua Web

**Vấn đề:** `OtaManager.kt` đã có logic `downloadAndInstallApk(url)` để tải từ URL, nhưng **chưa hỗ trợ upload trực tiếp** file APK từ trình duyệt (multipart form-data). ApiHandler cũng chưa có endpoint `/api/ota/*`.

**Giải pháp:** Thêm các endpoint OTA vào ApiHandler và bổ sung method xử lý multipart upload trong OtaManager.

### Các bước:

- [ ] **C1.** Thêm route group `/api/ota/*` vào `ApiHandler.handleRequest()`:
  ```
  uri.startsWith("/api/ota/") -> handleOta(session)
  ```

- [ ] **C2.** Implement `handleOta()` trong `ApiHandler.kt` với các sub-routes:
  - `GET /api/ota/info` → Trả về `{ version, rootAccess, deviceModel }`.
  - `POST /api/ota/upload` → Parse multipart form-data (NanoHTTPD hỗ trợ sẵn qua `session.parseBody()`), lưu file vào `context.cacheDir`, sau đó gọi `installApkSilently()`.
  - `POST /api/ota/install` → Gọi `OtaManager.installApkSilently()` cho APK đã lưu sẵn.

- [ ] **C3.** Bổ sung method `installFromUpload(inputStream, fileName)` vào `OtaManager.kt`
  - Lưu InputStream vào cache dir.
  - Gọi `installApkSilently()`.
  - Trả về `Boolean` kết quả.

- [ ] **C4.** Bổ sung logic restart app sau khi install thành công
  - Sử dụng `AlarmManager` schedule restart trong 1 giây.
  - `System.exit(0)` sau khi schedule.

---

## D. API `/api/console/send` — Text Injection

**Vấn đề:** Web UI cần gửi text command mô phỏng giọng nói (cho mục đích debug/test), nhưng chưa có endpoint.

**Giải pháp:** Thêm endpoint `/api/console/send` gọi thẳng vào pipeline AI (giống logic trong `MainService.sttManager.onResult`).

### Các bước:

- [ ] **D1.** Thêm route `POST /api/console/send` vào `ApiHandler.handleRequest()`
  - Body: `{ "text": "..." }`
  - Logic: Lấy text → gọi `GeminiProxy.generateContent()` → trả response JSON.
  - Khác với `/api/chat` ở chỗ: `/api/console/send` có thể trigger TTS phát qua loa (nếu cần) trong khi `/api/chat` chỉ trả text.

- [ ] **D2.** Expose method `sendTextCommand(text: String)` trên `MainService`
  - Logic giống `sttManager` callback nhưng nhận text trực tiếp.
  - Tùy chọn: phát TTS response qua loa R1 hoặc chỉ trả text.

---

## E. DeviceManager — Định danh & Cloud Sync

**Vấn đề:** Chưa có file `DeviceManager.kt`. Thiếu logic:
- Tạo device identity dựa trên MAC address.
- Binding Flow (mã 6 số, TTL 5 phút).
- Agent list fetching.
- Chat history sync.
- Device profile sync với Xiaozhi Server.

**Giải pháp:** Tạo file mới `manager/DeviceManager.kt`.

### Các bước:

- [ ] **E1.** Tạo file `manager/DeviceManager.kt` với skeleton
  - Constructor nhận `Context` và `ConfigManager`.
  - Property `deviceId: String` — ưu tiên MAC address qua `WifiManager`, fallback UUID prefix `R1-`.
  - Lưu `deviceId` vào `SharedPreferences` (persist).

- [ ] **E2.** Implement Binding Flow
  - Method `generateBindingCode(): String` — random 6-digit code.
  - Lưu code + timestamp vào `SharedPreferences`.
  - Method `validateBindingCode(code: String): Boolean` — kiểm tra code + TTL 5 phút.

- [ ] **E3.** Implement Agent Orchestration
  - Data class `Agent(id, name, description, isActive)`.
  - Method `fetchAgentList(serverBaseUrl, token): List<Agent>` — gọi `GET ${baseUrl}/agent/list`.

- [ ] **E4.** Implement Chat History Sync
  - Method `fetchChatHistory(serverBaseUrl, agentId): List<ChatMessage>` — gọi `GET ${baseUrl}/agent/${agentId}/chat-history/user`.

- [ ] **E5.** Implement Device Profile Sync
  - Method `syncDeviceProfile(serverBaseUrl, deviceId, settings)` — gọi `PUT /device/update/${deviceId}`.

- [ ] **E6.** Thêm các API routes cho DeviceManager vào `ApiHandler.kt`
  - `GET /api/device/info`
  - `POST /api/device/bind`
  - `GET /api/device/agents`
  - `GET /api/device/history`

---

## F. Physical Button Handling

**Vấn đề:** R1 có nút vật lý trên đỉnh loa nhưng chưa có code xử lý. Thiếu `ButtonListener` hoặc BroadcastReceiver cho `ACTION_MEDIA_BUTTON`.

**Giải pháp:** Đăng ký BroadcastReceiver bắt sự kiện nút nhấn.

### Các bước:

- [ ] **F1.** Tạo file `ButtonListener.kt` (hoặc tích hợp vào `MainService`)
  - Đăng ký `BroadcastReceiver` cho `Intent.ACTION_MEDIA_BUTTON`.
  - Phân biệt Short Press vs Long Press dựa trên `KeyEvent.ACTION_DOWN` duration.

- [ ] **F2.** Implement Short Press logic
  - Nếu đang phát nhạc → dừng phát.
  - Nếu idle → trigger wake-up (giống wake word detected).

- [ ] **F3.** Implement Long Press logic
  - Trigger chức năng phụ (VD: reset WiFi, vào pairing mode, v.v.)
  - Có thể phát một âm thanh xác nhận.

- [ ] **F4.** Đăng ký receiver trong `MainService.onCreate()`
  - `registerReceiver(buttonListener, IntentFilter(Intent.ACTION_MEDIA_BUTTON))`
  - Hủy đăng ký trong `onDestroy()`.

---

## G. MainService — Thiếu init LedManager & AudioManager

**Vấn đề:** `MainService.kt` hiện tại **không khởi tạo** `LedManager` và `AudioManager` (EQ/Volume). Hai class này đã viết xong nhưng không được sử dụng ở đâu cả. Theo thiết kế, `LedManager` cần set trạng thái `BOOTING` khi service start.

**Giải pháp:** Thêm init vào `MainService.onCreate()` và expose qua Singleton.

### Các bước:

- [ ] **G1.** Thêm property `LedManager` và `AudioManager` vào `MainService`
  ```kotlin
  private lateinit var ledManager: LedManager
  private lateinit var audioManager: AudioManager
  ```

- [ ] **G2.** Init trong `onCreate()` sau `startForegroundNotification()`
  ```kotlin
  ledManager = LedManager()
  ledManager.setMode("on") // BOOTING state
  audioManager = AudioManager(this)
  ```

- [ ] **G3.** Expose getter methods cho `ApiHandler` truy cập qua Singleton
  ```kotlin
  fun getLedManager() = ledManager
  fun getAudioManager() = audioManager
  ```

- [ ] **G4.** Cleanup trong `onDestroy()`
  ```kotlin
  audioManager.release()
  ```

---

## H. API thiếu trong ApiHandler

**Vấn đề:** Nhiều endpoint được định nghĩa trong `plan.md` nhưng chưa có trong `ApiHandler.kt`:
- LED APIs (`/api/led/*`)
- Audio/EQ APIs (`/api/audio/*`, `/api/eq/*`, `/api/volume`)
- Alarm/Timer APIs (`/api/alarms/*`, `/api/timers/*`)
- Casting APIs (`/api/casting/*`)

**Giải pháp:** Thêm các route group vào `ApiHandler`.

### Các bước:

- [ ] **H1.** Thêm route group `/api/led/*` → `handleLed(session)`
  - `GET /api/led/status` → Trả về mode, color hiện tại.
  - `POST /api/led/mode` → body `{ mode: "off"|"on"|"music" }` → `LedManager.setMode()`.
  - `POST /api/led/color` → body `{ color: "#ea580c" }` → `LedManager.setColor()`.

- [ ] **H2.** Thêm route group `/api/audio/*` và `/api/volume`
  - `GET /api/volume` → `AudioManager.getVolume()`.
  - `POST /api/volume` → body `{ level: 75 }` → `AudioManager.setVolume()`.
  - `GET /api/eq/bands` → Trả về EQ state hiện tại.
  - `POST /api/eq/bands` → body `{ bass, mid, treble }` → `AudioManager.setEqBands()`.

- [ ] **H3.** Thêm route group `/api/alarms/*` và `/api/timers/*`
  - `GET /api/alarms` → Trả về danh sách alarm.
  - `POST /api/alarms` → Tạo alarm mới.
  - `PUT /api/alarms/{id}` → Toggle enable/disable.
  - `DELETE /api/alarms/{id}` → Xóa alarm.
  - Tương tự cho timers.
  - **Lưu ý:** `AlarmManager.kt` hiện chỉ có `scheduleAlarm()` và `syncAlarms()`, cần bổ sung `getAlarms()`, `addAlarm()`, `removeAlarm()`, `toggleAlarm()`.

- [ ] **H4.** Thêm route group `/api/casting/*`
  - `GET /api/casting/status` → `{ airplay, dlna, deviceName }`.
  - `POST /api/casting/airplay` → `{ enabled: true/false }`.
  - `POST /api/casting/dlna` → `{ enabled: true/false }`.
  - `POST /api/casting/name` → `{ name: "..." }`.

- [ ] **H5.** Init các Manager còn thiếu trong `ApiHandler`
  - Hiện `ApiHandler` tự tạo `SmartHomeManager()` nhưng **không** init `LedManager`, `AudioManager`, `AlarmManager`, `CastingManager`, `OtaManager`.
  - Cách tiếp cận: Lấy từ `MainService.instance` (Singleton pattern) thay vì tạo instance mới.

---

## I. WebSocketProtocol — Thiếu Reconnect Logic

**Vấn đề:** `WebSocketProtocol.kt` hiện tại khi mất kết nối (`onFailure`) chỉ print stack trace, **không có cơ chế exponential backoff reconnect** như thiết kế yêu cầu.

**Giải pháp:** Thêm reconnect logic với exponential backoff.

### Các bước:

- [ ] **I1.** Thêm property reconnect
  ```kotlin
  private var reconnectAttempts = 0
  private val MAX_RECONNECT_ATTEMPTS = 10
  private val BASE_DELAY_MS = 1000L // 1s, 2s, 4s, 8s... max 30s
  ```

- [ ] **I2.** Implement `scheduleReconnect()` trong `onFailure` callback
  - Tính delay: `min(BASE_DELAY_MS * 2^attempts, 30000)`.
  - Sử dụng `Handler.postDelayed()` hoặc coroutine `delay()`.
  - Gọi lại `connect()`.

- [ ] **I3.** Reset `reconnectAttempts = 0` trong `onOpen` callback

---

## J. SmartHomeManager — MQTT thực tế

**Vấn đề:** `SmartHomeManager` hiện tại là **skeleton** — dùng `Thread.sleep()` giả lập kết nối MQTT, thiết bị là hardcoded mock data. Chưa tích hợp thư viện MQTT thực tế (Eclipse Paho).

**Giải pháp:** Tích hợp Eclipse Paho MQTT Client.

### Các bước:

- [ ] **J1.** Thêm dependency Paho MQTT vào `build.gradle.kts`
  ```kotlin
  implementation("org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5")
  ```

- [ ] **J2.** Refactor `SmartHomeManager.connect()` sử dụng `MqttClient` thực
  - Tạo `MqttConnectOptions` với username/password.
  - Implement `MqttCallback` xử lý `messageArrived()`.
  - Parse MQTT payload từ Home Assistant (`homeassistant/+/+/state`).

- [ ] **J3.** Refactor `publish()` gọi `mqttClient.publish()` thực tế

- [ ] **J4.** Refactor `toggleDevice()` gửi MQTT command thực
  - Topic: `homeassistant/{type}/{deviceId}/set`
  - Payload: `ON` / `OFF`

- [ ] **J5.** Thêm auto-discovery thiết bị từ MQTT
  - Subscribe `homeassistant/+/+/config` để tự phát hiện thiết bị mới.

---

## K. Voiceprints Management

**Vấn đề:** Chưa có logic đăng ký nhận diện giọng nói (voice biometrics) cho từng người dùng.

**Giải pháp:** Triển khai luồng ghi mẫu giọng và gửi lên server.

### Các bước:

- [ ] **K1.** Tạo data class `VoicePrint(id, name, sampleCount, createdAt)`

- [ ] **K2.** Tạo file `manager/VoicePrintManager.kt`
  - Method `startRecordingSample()` — ghi 5 giây audio PCM.
  - Method `submitVoicePrint(name, audioData)` — `POST /agent/voice-print` lên Xiaozhi Server.

- [ ] **K3.** Thêm API route `/api/voiceprint/*` vào ApiHandler
  - `GET /api/voiceprint/list`
  - `POST /api/voiceprint/record`
  - `DELETE /api/voiceprint/{id}`

---

## Tổng hợp tiến độ

| Nhóm | Mô tả | Số bước | Trạng thái |
|------|-------|---------|------------|
| A | CrashLogger | 3 | ⬜ Chưa bắt đầu |
| B | API `/api/logs` | 2 | ⬜ Chưa bắt đầu |
| C | API `/api/ota/upload` | 4 | ⬜ Chưa bắt đầu |
| D | API `/api/console/send` | 2 | ⬜ Chưa bắt đầu |
| E | DeviceManager | 6 | ⬜ Chưa bắt đầu |
| F | Button Handling | 4 | ⬜ Chưa bắt đầu |
| G | Init LedManager & AudioManager | 4 | ⬜ Chưa bắt đầu |
| H | API thiếu (LED, EQ, Alarm, Casting) | 5 | ⬜ Chưa bắt đầu |
| I | WebSocket Reconnect | 3 | ⬜ Chưa bắt đầu |
| J | MQTT thực tế | 5 | ⬜ Chưa bắt đầu |
| K | Voiceprints | 3 | ⬜ Chưa bắt đầu |
| | **TỔNG** | **41** | |

### Thứ tự thực hiện đề xuất

```
Ưu tiên 1 (Nền tảng):  G → A → B → C → D
Ưu tiên 2 (API gap):   H → I
Ưu tiên 3 (Features):  E → F
Ưu tiên 4 (Advanced):  J → K
```

> **Ghi chú:** Bắt đầu từ nhóm **G** vì `LedManager` và `AudioManager` đã viết xong nhưng chưa được init — đây là fix nhanh nhất, mang lại giá trị ngay lập tức. Tiếp theo là **A+B** (CrashLogger + API logs) vì sẽ giúp debug tất cả các bước sau.
