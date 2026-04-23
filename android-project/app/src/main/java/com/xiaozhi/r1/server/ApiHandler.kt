package com.xiaozhi.r1.server

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import com.google.gson.Gson

import com.xiaozhi.r1.MainService
import com.xiaozhi.r1.manager.ConfigManager

class ApiHandler(private val context: Context) {
    private val gson = Gson()
    private val geminiProxy = GeminiProxy()
    private val configManager = ConfigManager(context)

    fun handleRequest(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val uri = session.uri
        val method = session.method

        // Auth Middleware
        val isAuthRequired = configManager.currentConfig.isWebAuthEnabled
        if (isAuthRequired && uri != "/api/auth-status") {
            val pinHeader = session.headers["x-pin-auth"]
            if (pinHeader != configManager.currentConfig.webUiPin) {
                return createJsonResponse(NanoHTTPD.Response.Status.UNAUTHORIZED, mapOf("error" to "Unauthorized. Invalid PIN."))
            }
        }

        return try {
            when {
                uri == "/api/auth-status" && method == NanoHTTPD.Method.GET -> handleAuthStatus()
                uri == "/api/status" && method == NanoHTTPD.Method.GET -> handleStatus()
                uri == "/api/config" && method == NanoHTTPD.Method.GET -> handleGetConfig()
                uri == "/api/config" && method == NanoHTTPD.Method.POST -> handleUpdateConfig(session)
                uri == "/api/chat" && method == NanoHTTPD.Method.POST -> handleChat(session)
                uri.startsWith("/api/bluetooth/") -> handleBluetooth(session)
                uri.startsWith("/api/wifi/") -> handleWifi(session)
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "Endpoint not found"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
    }

    private fun handleStatus(): NanoHTTPD.Response {
        val status = mapOf(
            "cpuUsage" to 25,
            "ramUsage" to 40,
            "uptime" to "12:34:56",
            "temperature" to 45.5,
            "storage" to mapOf("total" to 8, "used" to 2)
        )
        return createJsonResponse(NanoHTTPD.Response.Status.OK, status)
    }

    private fun handleAuthStatus(): NanoHTTPD.Response {
        val isAuthRequired = configManager.currentConfig.isWebAuthEnabled
        return createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("authRequired" to isAuthRequired))
    }

    private fun handleGetConfig(): NanoHTTPD.Response {
        val config = configManager.currentConfig.copy()
        
        // Mask LLM API Key
        if (config.llmApiKey.length > 6) {
            val key = config.llmApiKey
            config.llmApiKey = "${key.substring(0, 3)}***${key.substring(key.length - 3)}"
        } else if (config.llmApiKey.isNotEmpty()) {
            config.llmApiKey = "***"
        }

        // Mask Picovoice Key
        if (config.picovoiceAccessKey.length > 6) {
            val key = config.picovoiceAccessKey
            config.picovoiceAccessKey = "${key.substring(0, 3)}***${key.substring(key.length - 3)}"
        } else if (config.picovoiceAccessKey.isNotEmpty()) {
            config.picovoiceAccessKey = "***"
        }

        return createJsonResponse(NanoHTTPD.Response.Status.OK, config)
    }

    private fun handleUpdateConfig(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val body = getBodyParams(session).toMutableMap()
        
        // Ignore masked keys to prevent overwriting real keys
        val llmKey = body["llmApiKey"] as? String
        if (llmKey != null && llmKey.contains("***")) {
            body.remove("llmApiKey")
        }
        
        val pvKey = body["picovoiceAccessKey"] as? String
        if (pvKey != null && pvKey.contains("***")) {
            body.remove("picovoiceAccessKey")
        }

        configManager.updateConfig(body)
        
        // Broadcast change to reconnect WebSocketProtocol or Standalone mode if config changed
        MainService.instance?.applyMode()
        
        return createJsonResponse(NanoHTTPD.Response.Status.OK, configManager.currentConfig)
    }

    private fun handleChat(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val body = getBodyParams(session)
        val message = body["message"] as? String ?: return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "Missing message"))
        
        // Get active persona
        val activePersona = configManager.currentConfig.personas.find { it.id == configManager.currentConfig.activePersonaId }
        val systemPrompt = activePersona?.prompt ?: "Bạn là một trợ lý ảo thông minh cho loa Phicomm R1."
        
        val apiKey = configManager.currentConfig.llmApiKey
        if (apiKey.isEmpty()) {
            return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "LLM API Key is missing. Please configure it in Settings."))
        }
        
        val reply = geminiProxy.generateContent(apiKey, message, systemPrompt)
        
        return createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("response" to reply))
    }

    private fun handleBluetooth(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        return createJsonResponse(NanoHTTPD.Response.Status.OK, listOf<Any>())
    }

    private fun handleWifi(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        return createJsonResponse(NanoHTTPD.Response.Status.OK, listOf<Any>())
    }

    private fun getBodyParams(session: NanoHTTPD.IHTTPSession): Map<String, Any> {
        val map = HashMap<String, String>()
        session.parseBody(map)
        val postData = map["postData"] ?: return emptyMap()
        return try {
            gson.fromJson(postData, Map::class.java) as Map<String, Any>
        } catch (e: Exception) {
            emptyMap()
        }
    }

    private fun createJsonResponse(status: NanoHTTPD.Response.IStatus, data: Any): NanoHTTPD.Response {
        val json = gson.toJson(data)
        return NanoHTTPD.newFixedLengthResponse(status, "application/json", json)
    }
}
