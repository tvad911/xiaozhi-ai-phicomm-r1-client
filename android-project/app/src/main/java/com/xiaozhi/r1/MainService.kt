package com.xiaozhi.r1

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

import com.xiaozhi.r1.server.WebServer
import com.xiaozhi.r1.util.NsdHelper
import com.xiaozhi.r1.audio.SttManager
import com.xiaozhi.r1.audio.TtsManager
import com.xiaozhi.r1.audio.WakeWordManager
import com.xiaozhi.r1.manager.AlarmManager
import com.xiaozhi.r1.manager.AudioManager
import com.xiaozhi.r1.manager.CastingManager
import com.xiaozhi.r1.manager.ConfigManager
import com.xiaozhi.r1.manager.DeviceManager
import com.xiaozhi.r1.manager.LedManager
import com.xiaozhi.r1.manager.OtaManager
import com.xiaozhi.r1.manager.SmartHomeManager
import com.xiaozhi.r1.manager.VoicePrintManager
import com.xiaozhi.r1.media.MusicPlayer
import com.xiaozhi.r1.protocol.WebSocketProtocol
import com.xiaozhi.r1.server.GeminiProxy
import com.xiaozhi.r1.util.CrashLogger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

enum class ProvisionState {
    STATE_BOOT,
    STATE_NO_NETWORK,
    STATE_REQUEST_AUTH,
    STATE_WAIT_BIND,
    STATE_READY
}

class MainService : Service() {
    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    var currentState: ProvisionState = ProvisionState.STATE_BOOT
        private set
    
    private var webServer: WebServer? = null
    private var nsdHelper: NsdHelper? = null

    private lateinit var configManager: ConfigManager
    private lateinit var ledManager: LedManager
    private lateinit var audioManager: AudioManager
    private lateinit var otaManager: OtaManager
    private lateinit var alarmManager: AlarmManager
    private lateinit var castingManager: CastingManager
    private lateinit var smartHomeManager: SmartHomeManager
    private lateinit var deviceManager: DeviceManager
    private lateinit var voicePrintManager: VoicePrintManager
    private lateinit var buttonListener: ButtonListener
    lateinit var musicPlayer: MusicPlayer
    private lateinit var ttsManager: TtsManager
    private lateinit var sttManager: SttManager
    private var wakeWordManager: WakeWordManager? = null
    private var webSocketProtocol: WebSocketProtocol? = null
    private val geminiProxy = GeminiProxy()
    
    companion object {
        var instance: MainService? = null
    }

    override fun onCreate() {
        super.onCreate()
        CrashLogger.i("MainService", "Service started")
        startForegroundNotification()
        
        // Init Web Server in background thread to prevent NetworkOnMainThreadException
        webServer = WebServer(this, 8080)
        serviceScope.launch(Dispatchers.IO) {
            try {
                webServer?.start()
                CrashLogger.i("MainService", "Web Server started on port 8080")
            } catch (e: Exception) {
                e.printStackTrace()
                CrashLogger.e("MainService", "Failed to start Web Server: ${e.message}")
            }
        }

        // Init mDNS
        nsdHelper = NsdHelper(this)
        nsdHelper?.registerService("xiaozhi-r1", 8080)
        
        instance = this
        configManager = ConfigManager(this)
        
        ledManager = LedManager()
        ledManager.setMode("on") // BOOTING state
        audioManager = AudioManager(this)
        otaManager = OtaManager(this)
        alarmManager = AlarmManager(this)
        castingManager = CastingManager()
        smartHomeManager = SmartHomeManager()
        deviceManager = DeviceManager(this, configManager)
        voicePrintManager = VoicePrintManager(this)
        
        musicPlayer = MusicPlayer(this)
        ttsManager = TtsManager(this, musicPlayer)
        
        sttManager = SttManager(this) { text ->
            if (text.isNotEmpty()) {
                val config = configManager.currentConfig
                val activePersona = config.personas.find { it.id == config.activePersonaId }
                val systemPrompt = activePersona?.prompt ?: "Bạn là trợ lý ảo."
                val apiKey = config.llmApiKey
                
                if (apiKey.isNotEmpty()) {
                    serviceScope.launch {
                        val reply = geminiProxy.generateContent(apiKey, text, systemPrompt)
                        ttsManager.speak(reply)
                        
                        // Restart Wakeword after speaking (simplified for now)
                        wakeWordManager?.start()
                    }
                } else {
                    ttsManager.speak("Vui lòng cấu hình API Key trong phần cài đặt.")
                    wakeWordManager?.start()
                }
            } else {
                wakeWordManager?.start()
            }
        }

        buttonListener = ButtonListener(this)
        val filter = android.content.IntentFilter(android.content.Intent.ACTION_MEDIA_BUTTON)
        filter.priority = android.content.IntentFilter.SYSTEM_HIGH_PRIORITY
        registerReceiver(buttonListener, filter)

        applyMode()
    }

    fun applyMode() {
        val config = configManager.currentConfig
        CrashLogger.i("MainService", "Applying mode: standalone=${config.useStandaloneMode}")
        if (config.useStandaloneMode) {
            webSocketProtocol?.disconnect()
            webSocketProtocol = null
            
            wakeWordManager?.stop()
            wakeWordManager = WakeWordManager(this, config.picovoiceAccessKey, config.wakeWord) {
                // On wake word detected
                wakeWordManager?.stop()
                musicPlayer.stop() // Optional 'ting' sound
                sttManager.startListening()
            }
            wakeWordManager?.start()
        } else {
            wakeWordManager?.stop()
            wakeWordManager = null
            
            if (webSocketProtocol == null) {
                webSocketProtocol = WebSocketProtocol(config.serverUrl)
                webSocketProtocol?.connect()
            }
        }
    }

    fun getLedManager() = ledManager
    fun getAudioManager() = audioManager
    fun getOtaManager() = otaManager
    fun getAlarmManager() = alarmManager
    fun getCastingManager() = castingManager
    fun getSmartHomeManager() = smartHomeManager
    fun getDeviceManager() = deviceManager
    fun getVoicePrintManager() = voicePrintManager

    fun sendTextCommand(text: String) {
        serviceScope.launch {
            try {
                // Here we call gemini or other AI logic
                // In the original code, this was done via sttManager's callback
                CrashLogger.i("MainService", "Received text command: $text")
                val response = geminiProxy.generateContent(
                    configManager.currentConfig.llmApiKey,
                    text,
                    "You are Xiaozhi AI, a helpful assistant."
                )
                ttsManager.speak(response)
            } catch (e: Exception) {
                CrashLogger.e("MainService", "sendTextCommand failed: ${e.message}")
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // We don't use binding, just started service
    }

    override fun onDestroy() {
        super.onDestroy()
        CrashLogger.i("MainService", "Service destroyed")
        instance = null
        
        try {
            unregisterReceiver(buttonListener)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        webServer?.stop()
        nsdHelper?.unregisterService()
        wakeWordManager?.stop()
        webSocketProtocol?.disconnect()
        ttsManager.release()
        sttManager.release()
        musicPlayer.release()
        audioManager.release()
        serviceJob.cancel()
    }

    private fun startForegroundNotification() {
        val channelId = "xiaozhi_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Xiaozhi R1 Background Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val builder = Notification.Builder(this, channelId)
            val notification: Notification = builder
                .setContentTitle("Xiaozhi R1")
                .setContentText("Service is running in background")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .build()

            startForeground(1, notification)
        } else {
            // For Android 5.1 (API 22), we don't strictly need startForeground to stay alive
            // if we are running as a system/root app, but it's safe to just run as started service.
            // No action needed here.
        }
    }
    
    fun transitionState(newState: ProvisionState) {
        CrashLogger.i("MainService", "Transition state: $currentState -> $newState")
        currentState = newState
        when (newState) {
            ProvisionState.STATE_NO_NETWORK -> {
                ledManager.setColor("#FFA500") // Orange
            }
            ProvisionState.STATE_WAIT_BIND -> {
                ledManager.setColor("#800080") // Purple
            }
            ProvisionState.STATE_READY -> {
                ledManager.setColor("#00FF00") // Green
                // After 2s turn off
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    ledManager.setMode("off")
                }, 2000)
            }
            else -> {}
        }
    }
}
