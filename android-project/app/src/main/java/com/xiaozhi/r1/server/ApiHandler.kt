package com.xiaozhi.r1.server

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import com.google.gson.Gson

import com.xiaozhi.r1.manager.ConfigManager

class ApiHandler(private val context: Context) {
    private val gson = Gson()
    private val geminiProxy = GeminiProxy()
    private val configManager = ConfigManager(context)

    fun handleRequest(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val uri = session.uri
        val method = session.method

        return try {
            when {
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

    private fun handleGetConfig(): NanoHTTPD.Response {
        return createJsonResponse(NanoHTTPD.Response.Status.OK, configManager.currentConfig)
    }

    private fun handleUpdateConfig(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val body = getBodyParams(session)
        configManager.updateConfig(body)
        
        // TODO: Need to broadcast change to reconnect WebSocketProtocol if serverUrl changed
        return createJsonResponse(NanoHTTPD.Response.Status.OK, configManager.currentConfig)
    }

    private fun handleChat(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val body = getBodyParams(session)
        val message = body["message"] as? String ?: return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "Missing message"))
        
        // Typical system prompt, can be loaded from ConfigManager
        val systemPrompt = "Bạn là một trợ lý ảo thông minh cho loa Phicomm R1. Hãy trả lời ngắn gọn, thân thiện."
        
        val reply = geminiProxy.generateContent(message, systemPrompt)
        
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
