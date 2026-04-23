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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class MainService : Service() {
    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private var webServer: WebServer? = null
    private var nsdHelper: NsdHelper? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        
        // Init Web Server
        webServer = WebServer(this, 8081)
        webServer?.start()

        // Init mDNS
        nsdHelper = NsdHelper(this)
        nsdHelper?.registerService("xiaozhi-r1", 8081)
        
        // Initialize other managers...
        serviceScope.launch {
            // Background init tasks
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
        webServer?.stop()
        nsdHelper?.unregisterService()
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
