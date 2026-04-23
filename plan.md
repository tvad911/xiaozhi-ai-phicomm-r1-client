# Kế hoạch Triển khai Chi tiết — Xiaozhi R1 APK

> Tài liệu này chi tiết từng bước để chuyển đổi Web App (React + Express) thành APK cài trên loa Phicomm R1.
> Tham khảo kiến trúc tổng quan tại [techstack.md](./techstack.md).

---

## Phase 1: Refactor React Frontend — Tách Mock Data → API Hooks

**Mục tiêu:** Code React hiện tại chứa toàn bộ dữ liệu giả (mock) trong `App.tsx`. Cần tách thành các custom hook gọi API thật, giữ nguyên giao diện.

### 1.1. Tạo API client layer
- **File:** `src/lib/api.ts`
- Tạo hàm `fetchApi(path, options)` wrapper cho `fetch()`.
- Base URL tự động detect: `window.location.origin` (vì React được serve từ cùng server NanoHTTPD).
- Xử lý JSON response, error handling thống nhất.

### 1.2. Tạo custom hooks thay thế mock data

| Hook file | Thay thế cho | API Endpoints |
| :--- | :--- | :--- |
| `src/hooks/useSystemStatus.ts` | Hardcoded status cards | `GET /api/status` |
| `src/hooks/useBluetooth.ts` | `btDevices`, `profiles`, `btGroups` state | `GET/POST /api/bluetooth/*` |
| `src/hooks/useWifi.ts` | `wifiNetworks` state | `GET/POST /api/wifi/*` |
| `src/hooks/useMedia.ts` | `currentTrack`, `mediaQueue`, search | `GET/POST /api/player/*` |
| `src/hooks/useChat.ts` | Gemini direct call trong `handleChat` | `POST /api/chat` |
| `src/hooks/useLed.ts` | `ledMode`, `ledColor`, `ledDuration` | `GET/POST /api/led/*` |
| `src/hooks/useEqualizer.ts` | `eqBands` state | `GET/POST /api/eq/*` |
| `src/hooks/useSmartHome.ts` | `smartDevices`, `mqttStatus` | `GET/POST /api/smarthome/*` |
| `src/hooks/useAlarms.ts` | `alarms`, `timers` state | `GET/POST /api/alarms/*`, `/api/timers/*` |
| `src/hooks/useOta.ts` | `otaVersion`, OTA check | `GET/POST /api/ota/*` |
| `src/hooks/useCasting.ts` | `airplayStatus`, `dlnaStatus` | `GET/POST /api/casting/*` |
| `src/hooks/useConfig.ts` | `systemPrompt`, `voiceSpeed`, sensitivity | `GET/POST /api/config` |

### 1.3. Refactor `App.tsx`
- Xóa toàn bộ `useState` chứa mock data (khoảng 80+ state variables).
- Import và sử dụng các custom hooks ở trên.
- Giữ nguyên 100% JSX/CSS layout — chỉ thay đổi data source.
- Xóa import `@google/genai` — AI call chuyển sang backend.
- Xóa biến `process.env.GEMINI_API_KEY` khỏi `vite.config.ts`.

### 1.4. Cập nhật build config
- **File:** `vite.config.ts` — xóa `define: { 'process.env.GEMINI_API_KEY': ... }`.
- **File:** `package.json` — xóa dependency `@google/genai` (chuyển sang Android side).
- Chạy `npm run build` → verify thư mục `dist/` hoạt động offline.

---

## Phase 2: Dựng khung Android Project

**Mục tiêu:** Tạo Android project Kotlin có thể serve file HTML tĩnh qua NanoHTTPD.

### 2.1. Khởi tạo project Android Studio
- **Package name:** `com.xiaozhi.r1`
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 30
- **Compile SDK:** 34
- **Kotlin:** 1.9.21
- **Java compatibility:** 17

### 2.2. Cấu trúc thư mục dự án

```
app/
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/com/xiaozhi/r1/
│   │   ├── MainService.kt            # Foreground Service (Singleton)
│   │   ├── MainActivity.kt           # WebView container (test trên phone)
│   │   ├── BootReceiver.kt           # Auto-start on boot
│   │   ├── server/
│   │   │   ├── WebServer.kt          # NanoHTTPD server (:8081)
│   │   │   └── ApiHandler.kt         # REST API dispatcher (when block)
│   │   ├── manager/
│   │   │   ├── AudioManager.kt       # Mic recording + playback coordination
│   │   │   ├── BluetoothManager.kt   # BT scan, pair, connect, profiles, groups
│   │   │   ├── WifiManager.kt        # WiFi scan, connect, status
│   │   │   ├── LedManager.kt         # LED ring control via root shell
│   │   │   ├── MusicPlayer.kt        # ExoPlayer wrapper, playlist, queue
│   │   │   ├── TtsPlayer.kt          # URL-based TTS playback
│   │   │   ├── AlarmManager.kt       # Alarm scheduling + timer ticking
│   │   │   ├── SmartHomeManager.kt   # MQTT client for Home Assistant
│   │   │   ├── CastingManager.kt     # AirPlay/DLNA toggle + naming
│   │   │   ├── OtaManager.kt         # APK download + silent install
│   │   │   ├── ConfigManager.kt      # SharedPreferences read/write
│   │   │   └── DeviceManager.kt      # Device identity (MAC), binding
│   │   ├── audio/
│   │   │   ├── AudioRecorder.kt      # 16kHz Mono PCM capture + VAD
│   │   │   ├── OpusEncoder.kt        # JNI wrapper
│   │   │   └── OpusDecoder.kt        # JNI wrapper
│   │   ├── protocol/
│   │   │   ├── Protocol.kt           # Interface (sendText, sendAudio)
│   │   │   └── WebSocketProtocol.kt  # OkHttp WebSocket implementation
│   │   ├── model/
│   │   │   ├── Track.kt              # id, title, artist, url, coverUrl, duration
│   │   │   ├── BluetoothDevice.kt    # Mirror React interface
│   │   │   ├── BluetoothProfile.kt
│   │   │   ├── BluetoothGroup.kt
│   │   │   ├── WifiNetwork.kt
│   │   │   ├── SmartDevice.kt
│   │   │   ├── Alarm.kt
│   │   │   └── Timer.kt
│   │   └── util/
│   │       ├── ShellExecutor.kt      # Root shell command execution
│   │       ├── CrashLogger.kt        # In-memory rolling log buffer
│   │       └── NsdHelper.kt          # mDNS registration + discovery
│   ├── cpp/
│   │   ├── CMakeLists.txt
│   │   └── opus_jni.cpp              # JNI bridge for Opus codec
│   ├── assets/
│   │   └── web/                      # ← React dist/ output goes here
│   │       ├── index.html
│   │       ├── assets/
│   │       └── ...
│   └── res/
│       ├── xml/provider_paths.xml    # FileProvider for OTA
│       └── ...
├── build.gradle.kts
└── ...
```

### 2.3. Dependencies (`app/build.gradle.kts`)

```kotlin
dependencies {
    // Networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Embedded Web Server
    implementation("org.nanohttpd:nanohttpd:2.3.1")
    
    // Media Playback
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-session:1.2.1")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // AI (Gemini HTTP API — no SDK needed, use OkHttp directly)
    // No extra dependency — call REST API via OkHttp
}
```

### 2.4. AndroidManifest.xml — Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

<application android:usesCleartextTraffic="true">
    <service android:name=".MainService" android:exported="false" />
    <receiver android:name=".BootReceiver" android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.BOOT_COMPLETED" />
        </intent-filter>
    </receiver>
    <activity android:name=".MainActivity" android:exported="true">
        <!-- Launcher cho test trên phone -->
    </activity>
    <provider ... /> <!-- FileProvider cho OTA -->
</application>
```

### 2.5. MainService.kt — Orchestration Flow

```
onCreate() →
  1. startForegroundNotification()     // Prevent LMK kill
  2. initLedManager()                  // LED → BOOTING state
  3. startWebServer(:8081)             // NanoHTTPD + static assets/web/
  4. registerNsd()                     // mDNS: xiaozhi-r1.local
  5. loadConfig()                      // SharedPreferences
  6. connectToServer()                 // WebSocket to Xiaozhi Server
  7. initAudioComponents()             // AudioRecorder + ExoPlayer
  8. initButtonListener()              // Physical button on top
  9. startHotwordDetection()           // Wake word engine
  10. initOtaManager()                 // Auto-update listener
```

### 2.6. WebServer.kt — Routing Pattern

```kotlin
override fun serve(session: IHTTPSession): Response {
    val uri = session.uri
    return when {
        uri.startsWith("/api/") -> apiHandler.handleRequest(session)
        else -> serveStaticFile(uri)  // assets/web/*
    }
}
```

### 2.7. Nhúng React build
- Chạy `npm run build` trong repo React.
- Copy toàn bộ `dist/*` → `app/src/main/assets/web/`.
- Có thể tự động hóa bằng Gradle task `copyWebAssets`.

---

## Phase 3: Implement Hardware API Endpoints

**Mục tiêu:** Từng endpoint API trả về dữ liệu thật từ phần cứng R1.

### 3.1. WiFi APIs

| Method | Endpoint | Mô tả | Android API |
| :--- | :--- | :--- | :--- |
| GET | `/api/wifi/list` | Danh sách mạng WiFi xung quanh | `WifiManager.startScan()` + `getScanResults()` |
| GET | `/api/wifi/status` | Mạng đang kết nối, IP, MAC | `WifiManager.getConnectionInfo()` |
| POST | `/api/wifi/connect` | Kết nối mạng mới `{ssid, password}` | `WifiManager.addNetwork()` + `enableNetwork()` |
| POST | `/api/wifi/disconnect` | Ngắt kết nối hiện tại | `WifiManager.disconnect()` |

### 3.2. Bluetooth APIs

| Method | Endpoint | Mô tả | Android API |
| :--- | :--- | :--- | :--- |
| GET | `/api/bluetooth/status` | Trạng thái BT adapter | `BluetoothAdapter.isEnabled()` |
| POST | `/api/bluetooth/scan` | Quét thiết bị BT xung quanh | `BluetoothAdapter.startDiscovery()` |
| GET | `/api/bluetooth/devices` | Danh sách paired + discovered | `BluetoothAdapter.getBondedDevices()` |
| POST | `/api/bluetooth/pair` | Bật chế độ pairing | `ACTION_REQUEST_DISCOVERABLE` |
| POST | `/api/bluetooth/connect` | Kết nối thiết bị `{mac}` | `BluetoothDevice.createBond()` |
| POST | `/api/bluetooth/disconnect` | Ngắt kết nối `{mac}` | Reflection: `removeBond()` |
| GET | `/api/bluetooth/profiles` | Danh sách profile đã lưu | SharedPreferences (JSON) |
| POST | `/api/bluetooth/profiles` | Tạo/Cập nhật profile | SharedPreferences |
| DELETE | `/api/bluetooth/profiles/{id}` | Xóa profile | SharedPreferences |
| GET | `/api/bluetooth/groups` | Danh sách audio group | SharedPreferences |
| POST | `/api/bluetooth/groups` | Tạo/Cập nhật group | SharedPreferences |
| DELETE | `/api/bluetooth/groups/{id}` | Xóa group | SharedPreferences |

### 3.3. LED APIs

| Method | Endpoint | Mô tả | Implementation |
| :--- | :--- | :--- | :--- |
| GET | `/api/led/status` | Mode, color, speed hiện tại | In-memory state |
| POST | `/api/led/mode` | Đổi mode `{mode: "off"|"on"|"music"}` | `ShellExecutor` → `/sys/class/leds/` |
| POST | `/api/led/color` | Đổi màu `{color: "#ea580c"}` | Shell command, parse hex → RGB |
| POST | `/api/led/speed` | Đổi tốc độ `{duration: 2000}` | In-memory + shell animation |

### 3.4. Audio & EQ APIs

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/audio/state` | Trạng thái mic (muted?), audio state |
| POST | `/api/audio/mute` | Toggle mic mute |
| GET | `/api/eq/bands` | `{bass, mid, treble}` values |
| POST | `/api/eq/bands` | Cập nhật EQ `{bass: 5, mid: 0, treble: 3}` |
| GET | `/api/volume` | Mức âm lượng 0-100 |
| POST | `/api/volume` | Set âm lượng `{level: 75}` |

### 3.5. Config APIs

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/config` | Toàn bộ config (serverUrl, systemPrompt, voiceSpeed, sensitivity, silenceTimeout, macAddress, otaVersion) |
| POST | `/api/config` | Cập nhật config → SharedPreferences |

---

## Phase 4: Tích hợp AI (Gemini Proxy)

**Mục tiêu:** Chuyển Gemini API call từ client-side sang server-side (Android APK).

### 4.1. Chat endpoint

| Method | Endpoint | Body | Response |
| :--- | :--- | :--- | :--- |
| POST | `/api/chat` | `{message: "...", systemPrompt: "..."}` | `{response: "..."}` |

### 4.2. Implementation trong `ApiHandler.kt`
```
1. Nhận POST /api/chat
2. Đọc GEMINI_API_KEY từ SharedPreferences (ConfigManager)
3. Dùng OkHttp gọi Gemini REST API:
   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
   Headers: x-goog-api-key: <key>
   Body: { contents: [...], systemInstruction: {...} }
4. Parse response JSON
5. Áp dụng scrubResponse() (blacklist phrases filter)
6. Trả về JSON cho frontend
```

### 4.3. Mic → AI pipeline (Voice interaction)
```
AudioRecorder (16kHz PCM)
  → VAD (energy-based silence detection)
  → OpusEncoder (JNI)
  → WebSocketProtocol → Xiaozhi Server
  → Server trả response text
  → TtsPlayer (URL-based playback) hoặc OpusDecoder → AudioTrack
```

---

## Phase 5: Media Player — ExoPlayer + Piped

**Mục tiêu:** Phát nhạc thực tế trên loa R1 từ YouTube/SoundCloud/Zing MP3.

### 5.1. Player APIs

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/player/status` | isPlaying, currentTrack, playlist, progress |
| POST | `/api/player/play` | Play track `{url, title, artist, coverUrl}` |
| POST | `/api/player/pause` | Pause |
| POST | `/api/player/resume` | Resume |
| POST | `/api/player/stop` | Stop + clear |
| POST | `/api/player/next` | Skip forward |
| POST | `/api/player/prev` | Skip backward |
| POST | `/api/player/queue` | Add to queue |
| DELETE | `/api/player/queue` | Clear queue |
| POST | `/api/player/shuffle` | Toggle shuffle `{enabled: true}` |
| POST | `/api/player/repeat` | Set repeat `{mode: "none"|"one"|"all"}` |
| POST | `/api/player/volume` | Set volume `{level: 70}` |

### 5.2. Piped Integration Pattern (Browser-side Orchestration)
```
1. User search "Nấu Ăn Cho Em" trên React UI
2. React (browser) gọi Piped API: GET https://pipedapi.kavin.rocks/search?q=...
3. User chọn bài → React gọi: GET https://pipedapi.kavin.rocks/streams/{videoId}
4. React lấy direct audio URL từ response
5. React gửi POST /api/player/play {url: "<direct-url>", title, artist, coverUrl}
6. Android MusicPlayer dùng ExoPlayer play URL đó
7. React poll GET /api/player/status mỗi 3s để đồng bộ UI
```

### 5.3. MusicPlayer.kt — Core Logic
- Wrap `Media3 ExoPlayer`.
- `MutableList<Track>` cho playlist queue.
- Hỗ trợ `next()`, `prev()`, `shuffle`, `repeat`.
- Callback `onPlaybackComplete` → auto next track.
- Audio Focus: `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` (duck BT audio).

---

## Phase 6: Advanced Features

### 6.1. Alarms & Timers

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/alarms` | Danh sách alarm |
| POST | `/api/alarms` | Tạo alarm `{time, label, days}` |
| PUT | `/api/alarms/{id}` | Toggle enable/disable, update days |
| DELETE | `/api/alarms/{id}` | Xóa alarm |
| POST | `/api/alarms/{id}/dismiss` | Tắt chuông đang kêu |
| GET | `/api/timers` | Danh sách timer |
| POST | `/api/timers` | Tạo timer `{label, minutes}` |
| POST | `/api/timers/{id}/toggle` | Start/Pause timer |
| DELETE | `/api/timers/{id}` | Xóa timer |

- **Implementation:** `AlarmManager.kt` sử dụng Android `AlarmManager` API cho alarm chính xác. Timer dùng `CountDownTimer` hoặc coroutine-based tick.

### 6.2. Smart Home (MQTT)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/smarthome/status` | MQTT connection status |
| POST | `/api/smarthome/connect` | Connect to MQTT broker `{host, port}` |
| GET | `/api/smarthome/devices` | Mapped smart devices |
| POST | `/api/smarthome/devices/{id}/toggle` | Toggle device state |

- **Implementation:** Sử dụng Eclipse Paho MQTT Client cho Android. Map voice commands tới MQTT topics.

### 6.3. Casting (AirPlay / DLNA)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/casting/status` | AirPlay + DLNA on/off, device name |
| POST | `/api/casting/airplay` | Toggle AirPlay `{enabled: true}` |
| POST | `/api/casting/dlna` | Toggle DLNA `{enabled: true}` |
| POST | `/api/casting/name` | Đổi broadcast name `{name: "..."}` |

- **Lưu ý:** AirPlay thực sự trên Android cần thư viện bên thứ ba (ví dụ `shairport-sync` qua native binary). DLNA dùng `Cling` hoặc `DLNACast` library. Có thể implement ở giai đoạn sau nếu phức tạp.

### 6.4. OTA Update

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/ota/info` | Version hiện tại, root status |
| POST | `/api/ota/check` | Kiểm tra update từ server |
| POST | `/api/ota/upload` | Upload APK (multipart form-data) |
| POST | `/api/ota/install` | Silent install APK (`pm install -r` via root) |

---

## Phase 7: Build, Test, Deploy

### 7.1. Build React assets
```bash
cd xiaozhi-ai-phicomm-r1/   # React project
npm run build
cp -r dist/* ../android-project/app/src/main/assets/web/
```

### 7.2. Build APK
```bash
cd android-project/
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### 7.3. Test trên phone (có màn hình)
```bash
adb install app-debug.apk
adb shell pm grant com.xiaozhi.r1 android.permission.RECORD_AUDIO
adb shell pm grant com.xiaozhi.r1 android.permission.ACCESS_FINE_LOCATION
# Mở app → WebView hiện http://localhost:8081
```

### 7.4. Deploy lên Phicomm R1
```bash
# Qua USB
adb install app-debug.apk

# Qua mạng (ADB over WiFi)
adb connect <R1-IP>:5555
adb install app-debug.apk

# Qua OTA (nếu đã có bản cũ chạy)
curl -X POST http://<R1-IP>:8081/api/ota/upload -F "file=@app-debug.apk"
curl -X POST http://<R1-IP>:8081/api/ota/install
```

### 7.5. Verify hoạt động
1. Từ phone/laptop cùng WiFi, mở browser → `http://<R1-IP>:8081`
2. Giao diện React Admin phải hiện đầy đủ
3. Test từng tab: Dashboard, Chat (AI), Media, Connectivity, Streaming, Smart Home, Utilities, Setup

---

## Checklist tổng hợp

| # | Task | Phase | Priority | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Tạo `src/lib/api.ts` | P1 | 🔴 Critical | [x] Đã làm |
| 2 | Tạo 12 custom hooks thay mock data | P1 | 🔴 Critical | [x] Đã làm |
| 3 | Refactor `App.tsx` — xóa mock, dùng hooks | P1 | 🔴 Critical | [~] Đang làm |
| 4 | Xóa `@google/genai` khỏi frontend | P1 | 🔴 Critical | [x] Đã làm |
| 5 | Khởi tạo Android project (Kotlin) | P2 | 🔴 Critical | [x] Đã làm |
| 6 | `MainService.kt` — Foreground Service skeleton | P2 | 🔴 Critical | [x] Đã làm |
| 7 | `WebServer.kt` — NanoHTTPD serve static | P2 | 🔴 Critical | [x] Đã làm |
| 8 | `ApiHandler.kt` — route dispatcher | P2 | 🔴 Critical | [x] Đã làm |
| 9 | `NsdHelper.kt` — mDNS registration | P2 | 🟡 High | [x] Đã làm |
| 10 | Copy React `dist/` → `assets/web/` | P2 | 🔴 Critical | [x] Đã làm |
| 11 | `WifiManager.kt` — scan, connect, status | P3 | 🔴 Critical | [x] Đã làm |
| 12 | `BluetoothManager.kt` — scan, pair, profiles, groups | P3 | 🔴 Critical | [x] Đã làm |
| 13 | `LedManager.kt` — root shell LED control | P3 | 🟡 High | [x] Đã làm |
| 14 | Audio EQ + Volume control | P3 | 🟡 High | [x] Đã làm |
| 15 | `ConfigManager.kt` — SharedPreferences | P3 | 🔴 Critical | [x] Đã làm |
| 16 | Gemini proxy `/api/chat` via OkHttp | P4 | 🔴 Critical | [x] Đã làm |
| 17 | `AudioRecorder.kt` + VAD | P4 | 🟡 High | [x] Đã làm |
| 18 | Opus JNI bridge (C++) | P4 | 🟡 High | [x] Đã làm |
| 19 | `WebSocketProtocol.kt` — server connection | P4 | 🟡 High | [x] Đã làm |
| 20 | `MusicPlayer.kt` — ExoPlayer wrapper | P5 | 🔴 Critical | [x] Đã làm |
| 21 | Piped search integration | P5 | 🟡 High | [x] Đã làm |
| 22 | Playlist queue + shuffle + repeat | P5 | 🟡 High | [x] Đã làm |
| 23 | `AlarmManager.kt` — alarm + timer | P6 | 🟢 Medium | [x] Đã làm |
| 24 | `SmartHomeManager.kt` — MQTT | P6 | 🟢 Medium | [x] Đã làm |
| 25 | `CastingManager.kt` — AirPlay/DLNA | P6 | 🟢 Medium | [x] Đã làm |
| 26 | `OtaManager.kt` — upload + silent install | P6 | 🟡 High | [x] Đã làm |
| 27 | `BootReceiver.kt` — auto-start | P6 | 🟡 High | [x] Đã làm |
| 28 | `MainActivity.kt` — WebView test container | P7 | 🟢 Medium | [ ] Chưa làm |
| 29 | Build + test trên phone | P7 | 🔴 Critical | [ ] Chưa làm |
| 30 | Deploy lên R1 thật | P7 | 🔴 Critical | [ ] Chưa làm |
