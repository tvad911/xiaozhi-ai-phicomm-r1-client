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
import com.xiaozhi.r1.manager.ConfigManager
import com.xiaozhi.r1.media.MusicPlayer
import com.xiaozhi.r1.protocol.WebSocketProtocol
import com.xiaozhi.r1.server.GeminiProxy
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class MainService : Service() {
    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private var webServer: WebServer? = null
    private var nsdHelper: NsdHelper? = null

    private lateinit var configManager: ConfigManager
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
        startForegroundNotification()
        
        // Init Web Server in background thread to prevent NetworkOnMainThreadException
        webServer = WebServer(this, 8081)
        serviceScope.launch(Dispatchers.IO) {
            try {
                webServer?.start()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Init mDNS
        nsdHelper = NsdHelper(this)
        nsdHelper?.registerService("xiaozhi-r1", 8081)
        
        instance = this
        configManager = ConfigManager(this)
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

        applyMode()
    }

    fun applyMode() {
        val config = configManager.currentConfig
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

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // We don't use binding, just started service
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        webServer?.stop()
        nsdHelper?.unregisterService()
        wakeWordManager?.stop()
        webSocketProtocol?.disconnect()
        ttsManager.release()
        sttManager.release()
        musicPlayer.release()
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

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        val notification: Notification = builder
            .setContentTitle("Xiaozhi R1")
            .setContentText("Service is running in background")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .build()

        startForeground(1, notification)
    }
}
