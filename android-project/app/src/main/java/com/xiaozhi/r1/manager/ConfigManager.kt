package com.xiaozhi.r1.manager

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson

data class AppConfig(
    var serverUrl: String = "wss://api.xiaozhi.me",
    var systemPrompt: String = "Bạn là một trợ lý ảo thông minh cho loa Phicomm R1.",
    var voiceSpeed: Float = 1.0f,
    var activationSensitivity: Int = 70,
    var silenceTimeout: Int = 1500,
    var macAddress: String = "00:E0:4C:68:01:AF",
    var otaVersion: String = "1.5.2"
)

class ConfigManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("R1Config", Context.MODE_PRIVATE)
    private val gson = Gson()
    var currentConfig: AppConfig = AppConfig()
        private set

    init {
        loadConfig()
    }

    private fun loadConfig() {
        val configJson = prefs.getString("config_json", null)
        if (configJson != null) {
            try {
                currentConfig = gson.fromJson(configJson, AppConfig::class.java)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun saveConfig(config: AppConfig) {
        currentConfig = config
        prefs.edit().putString("config_json", gson.toJson(config)).apply()
    }

    fun updateConfig(partialUpdate: Map<String, Any>) {
        // Simplified partial update, in reality we'd merge the map
        val currentJson = gson.toJsonTree(currentConfig).asJsonObject
        partialUpdate.forEach { (key, value) ->
            currentJson.add(key, gson.toJsonTree(value))
        }
        val newConfig = gson.fromJson(currentJson, AppConfig::class.java)
        saveConfig(newConfig)
    }
}
