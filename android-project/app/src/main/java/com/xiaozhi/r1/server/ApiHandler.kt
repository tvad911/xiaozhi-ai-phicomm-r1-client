package com.xiaozhi.r1.server

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import com.google.gson.Gson

import com.xiaozhi.r1.MainService
import com.xiaozhi.r1.manager.ConfigManager
import com.xiaozhi.r1.manager.WifiManager
import com.xiaozhi.r1.manager.BluetoothManager
import com.xiaozhi.r1.media.PipedClient
import com.xiaozhi.r1.media.TrackInfo
import kotlinx.coroutines.runBlocking

class ApiHandler(private val context: Context) {
    private val gson = Gson()
    private val geminiProxy = GeminiProxy()
    private val configManager = ConfigManager(context)
    private val wifiManager = WifiManager(context)
    private val bluetoothManager = BluetoothManager(context)
    private val pipedClient = PipedClient()
    private val smartHomeManager = com.xiaozhi.r1.manager.SmartHomeManager()

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
                uri.startsWith("/api/media/") -> handleMedia(session)
                uri.startsWith("/api/smarthome/") -> handleSmartHome(session)
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "Endpoint not found"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
    }

    private fun handleStatus(): NanoHTTPD.Response {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memoryInfo = android.app.ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        val ramUsed = ((memoryInfo.totalMem - memoryInfo.availMem).toFloat() / memoryInfo.totalMem * 100).toInt()
        
        val stat = android.os.StatFs(android.os.Environment.getDataDirectory().path)
        val totalStorageBytes = stat.blockSizeLong * stat.blockCountLong
        val availableStorageBytes = stat.blockSizeLong * stat.availableBlocksLong
        val usedStorageBytes = totalStorageBytes - availableStorageBytes
        
        val totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024.0)).toInt()
        val usedStorageGB = (usedStorageBytes / (1024 * 1024 * 1024.0)).toInt()

        val uptimeMillis = android.os.SystemClock.elapsedRealtime()
        val hours = java.util.concurrent.TimeUnit.MILLISECONDS.toHours(uptimeMillis)
        val minutes = java.util.concurrent.TimeUnit.MILLISECONDS.toMinutes(uptimeMillis) % 60
        val uptimeString = String.format("%02d:%02d", hours, minutes)

        val activePersonaId = configManager.currentConfig.activePersonaId

        val status = mapOf(
            "ramUsage" to ramUsed,
            "uptime" to uptimeString,
            "storage" to mapOf("total" to totalStorageGB, "used" to usedStorageGB),
            "backend" to "Online",
            "model" to activePersonaId
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
        val uri = session.uri
        val method = session.method
        return try {
            when {
                uri == "/api/bluetooth/scan" && method == NanoHTTPD.Method.POST -> {
                    bluetoothManager.startDiscovery()
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("status" to "scanning"))
                }
                uri == "/api/bluetooth/devices" && method == NanoHTTPD.Method.GET -> {
                    val devices = bluetoothManager.getBondedDevices()
                    createJsonResponse(NanoHTTPD.Response.Status.OK, devices)
                }
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "Endpoint not found"))
            }
        } catch (e: Exception) {
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
    }

    private fun handleWifi(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val uri = session.uri
        val method = session.method
        return try {
            when {
                uri == "/api/wifi/scan" && method == NanoHTTPD.Method.POST -> {
                    wifiManager.startScan()
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("status" to "scanning"))
                }
                uri == "/api/wifi/networks" && method == NanoHTTPD.Method.GET -> {
                    val networks = wifiManager.getScanResults()
                    createJsonResponse(NanoHTTPD.Response.Status.OK, networks)
                }
                uri == "/api/wifi/connect" && method == NanoHTTPD.Method.POST -> {
                    val params = getBodyParams(session)
                    val ssid = params["ssid"] as? String ?: return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "Missing ssid"))
                    val password = params["password"] as? String
                    val success = wifiManager.connectToNetwork(ssid, password)
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to success))
                }
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "Endpoint not found"))
            }
        } catch (e: Exception) {
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
    }

    private fun handleMedia(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val uri = session.uri
        val method = session.method
        val musicPlayer = MainService.instance?.musicPlayer ?: return createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to "MusicPlayer not ready"))
        
        return try {
            when {
                uri == "/api/media/search" && method == NanoHTTPD.Method.POST -> {
                    val params = getBodyParams(session)
                    val query = params["query"] as? String ?: return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "Missing query"))
                    val results = runBlocking { pipedClient.search(query) }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, results)
                }
                uri == "/api/media/play" && method == NanoHTTPD.Method.POST -> {
                    val params = getBodyParams(session)
                    val trackJson = gson.toJson(params["track"])
                    val track = gson.fromJson(trackJson, TrackInfo::class.java)
                    
                    runBlocking {
                        val streamUrl = pipedClient.getStreamUrl(track.id)
                        if (streamUrl != null) {
                            // Run on main thread? MusicPlayer is ExoPlayer which needs main thread.
                            android.os.Handler(android.os.Looper.getMainLooper()).post {
                                musicPlayer.play(track, streamUrl)
                            }
                        }
                    }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                uri == "/api/media/enqueue" && method == NanoHTTPD.Method.POST -> {
                    val params = getBodyParams(session)
                    val trackJson = gson.toJson(params["track"])
                    val track = gson.fromJson(trackJson, TrackInfo::class.java)
                    
                    runBlocking {
                        val streamUrl = pipedClient.getStreamUrl(track.id)
                        if (streamUrl != null) {
                            android.os.Handler(android.os.Looper.getMainLooper()).post {
                                musicPlayer.enqueue(track, streamUrl)
                            }
                        }
                    }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                uri == "/api/media/queue" && method == NanoHTTPD.Method.GET -> {
                    createJsonResponse(NanoHTTPD.Response.Status.OK, musicPlayer.getQueue())
                }
                uri == "/api/media/pause" && method == NanoHTTPD.Method.POST -> {
                    android.os.Handler(android.os.Looper.getMainLooper()).post { musicPlayer.playPause() }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                uri == "/api/media/next" && method == NanoHTTPD.Method.POST -> {
                    android.os.Handler(android.os.Looper.getMainLooper()).post { musicPlayer.next() }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                uri == "/api/media/previous" && method == NanoHTTPD.Method.POST -> {
                    android.os.Handler(android.os.Looper.getMainLooper()).post { musicPlayer.previous() }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                uri == "/api/media/clear" && method == NanoHTTPD.Method.POST -> {
                    android.os.Handler(android.os.Looper.getMainLooper()).post { musicPlayer.clearQueue() }
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("success" to true))
                }
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "Endpoint not found"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
    }

    private fun handleSmartHome(session: NanoHTTPD.IHTTPSession): NanoHTTPD.Response {
        val uri = session.uri
        val method = session.method

        return try {
            when {
                uri == "/api/smarthome/status" && method == NanoHTTPD.Method.GET -> {
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("status" to smartHomeManager.mqttStatus))
                }
                uri == "/api/smarthome/devices" && method == NanoHTTPD.Method.GET -> {
                    createJsonResponse(NanoHTTPD.Response.Status.OK, smartHomeManager.getDevices())
                }
                uri == "/api/smarthome/toggle" && method == NanoHTTPD.Method.POST -> {
                    val params = getBodyParams(session)
                    val deviceId = params["deviceId"] as? String ?: return createJsonResponse(NanoHTTPD.Response.Status.BAD_REQUEST, mapOf("error" to "Missing deviceId"))
                    
                    smartHomeManager.toggleDevice(deviceId)
                    createJsonResponse(NanoHTTPD.Response.Status.OK, mapOf("status" to "toggled"))
                }
                else -> createJsonResponse(NanoHTTPD.Response.Status.NOT_FOUND, mapOf("error" to "SmartHome endpoint not found"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            createJsonResponse(NanoHTTPD.Response.Status.INTERNAL_ERROR, mapOf("error" to e.message))
        }
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
