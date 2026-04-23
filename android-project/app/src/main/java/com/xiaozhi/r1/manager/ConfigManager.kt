package com.xiaozhi.r1.manager

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.xiaozhi.r1.util.CryptoHelper

data class Persona(
    val id: String,
    val name: String,
    val prompt: String
)

data class AppConfig(
    var isWebAuthEnabled: Boolean = false,
    var webUiPin: String = "",
    var useStandaloneMode: Boolean = false,
    var serverUrl: String = "wss://api.xiaozhi.me",
    var picovoiceAccessKey: String = "",
    var wakeWord: String = "Hey Google",
    var llmProvider: String = "gemini",
    var llmApiKey: String = "",
    var ttsProvider: String = "google_translate",
    var ttsApiKey: String = "",
    var activePersonaId: String = "default",
    var personas: List<Persona> = listOf(
        Persona(
            "default", 
            "Xiaozhi AI", 
            "Bạn tên là Xiaozhi, một trợ lý ảo thông minh sống trong loa Phicomm R1. Hãy trả lời ngắn gọn, tự nhiên như giao tiếp ngôn ngữ nói hàng ngày, tuyệt đối không dùng gạch đầu dòng hay ký tự đặc biệt, không dài quá 2 câu."
        )
    ),
    var voiceSpeed: Float = 1.0f,
    var activationSensitivity: Int = 70,
    var silenceTimeout: Int = 1500,
    var macAddress: String = "00:E0:4C:68:01:AF",
    var otaVersion: String = "1.5.2"
)

class ConfigManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("R1Config", Context.MODE_PRIVATE)
    private val cryptoHelper = CryptoHelper(context)
    private val gson = Gson()
    var currentConfig: AppConfig = AppConfig()
        private set

    init {
        loadConfig()
    }

    private fun loadConfig() {
        val encryptedJson = prefs.getString("config_json_encrypted", null)
        if (encryptedJson != null) {
            try {
                val decryptedJson = cryptoHelper.decrypt(encryptedJson)
                if (decryptedJson.startsWith("{")) {
                    currentConfig = gson.fromJson(decryptedJson, AppConfig::class.java)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else {
            // Fallback for old plaintext config migration
            val configJson = prefs.getString("config_json", null)
            if (configJson != null) {
                try {
                    currentConfig = gson.fromJson(configJson, AppConfig::class.java)
                    // Save encrypted format immediately
                    saveConfig(currentConfig)
                    prefs.edit().remove("config_json").apply()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    fun saveConfig(config: AppConfig) {
        currentConfig = config
        val plainJson = gson.toJson(config)
        val encryptedJson = cryptoHelper.encrypt(plainJson)
        prefs.edit().putString("config_json_encrypted", encryptedJson).apply()
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
