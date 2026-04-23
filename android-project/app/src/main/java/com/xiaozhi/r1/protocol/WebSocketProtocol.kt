package com.xiaozhi.r1.protocol

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString

class WebSocketProtocol(private val serverUrl: String) {
    private val client = OkHttpClient()
    private var webSocket: WebSocket? = null
    
    var onMessageListener: ((String) -> Unit)? = null
    var onAudioDataListener: ((ByteArray) -> Unit)? = null
    var onConnectionStateChanged: ((Boolean) -> Unit)? = null

    fun connect() {
        val request = Request.Builder().url(serverUrl).build()
        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                onConnectionStateChanged?.invoke(true)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                // Handling JSON commands/responses from Xiaozhi server
                onMessageListener?.invoke(text)
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                // Handling binary audio data from server (TTS Output)
                onAudioDataListener?.invoke(bytes.toByteArray())
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
                onConnectionStateChanged?.invoke(false)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                onConnectionStateChanged?.invoke(false)
                t.printStackTrace()
            }
        }
        webSocket = client.newWebSocket(request, listener)
    }

    fun sendText(text: String) {
        webSocket?.send(text)
    }

    fun sendAudioData(pcmData: ByteArray) {
        // Here we send Opus encoded bytes to the server
        webSocket?.send(ByteString.of(*pcmData))
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
        webSocket = null
    }
}
