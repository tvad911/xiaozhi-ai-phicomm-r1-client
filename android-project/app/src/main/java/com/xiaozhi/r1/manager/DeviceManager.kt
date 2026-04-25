package com.xiaozhi.r1.manager

import android.content.Context
import android.net.wifi.WifiManager as AndroidWifiManager
import android.provider.Settings
import java.util.UUID

data class Agent(val id: String, val name: String, val description: String, val isActive: Boolean)
data class ChatMessage(val role: String, val content: String, val timestamp: Long)

class DeviceManager(private val context: Context, private val configManager: ConfigManager) {
    private val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)

    val deviceId: String

    init {
        var id = prefs.getString("device_id", null)
        if (id == null) {
            id = generateDeviceId()
            prefs.edit().putString("device_id", id).apply()
        }
        deviceId = id
    }

    private fun generateDeviceId(): String {
        try {
            if (android.os.Build.VERSION.SDK_INT <= 22) {
                val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as AndroidWifiManager
                val mac = wifiManager.connectionInfo?.macAddress
                if (mac != null && mac != "02:00:00:00:00:00") {
                    return "R1-${mac.replace(":", "").uppercase()}"
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        if (androidId != null) {
            return "R1-${androidId.uppercase()}"
        }
        
        return "R1-${UUID.randomUUID().toString().substring(0, 8).uppercase()}"
    }

    fun generateBindingCode(): String {
        val code = (100000..999999).random().toString()
        prefs.edit()
            .putString("binding_code", code)
            .putLong("binding_timestamp", System.currentTimeMillis())
            .apply()
        return code
    }

    fun validateBindingCode(code: String): Boolean {
        val storedCode = prefs.getString("binding_code", null) ?: return false
        val timestamp = prefs.getLong("binding_timestamp", 0)
        
        if (System.currentTimeMillis() - timestamp > 5 * 60 * 1000) {
            return false
        }
        
        return code == storedCode
    }

    fun fetchAgentList(serverBaseUrl: String, token: String): List<Agent> {
        return listOf(
            Agent("1", "Default Assistant", "Standard Xiaozhi AI", true)
        )
    }

    fun fetchChatHistory(serverBaseUrl: String, agentId: String): List<ChatMessage> {
        return emptyList()
    }

    fun syncDeviceProfile(serverBaseUrl: String, deviceId: String, settings: Map<String, Any>) {
    }
}
