package com.xiaozhi.r1.server

import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import com.google.gson.Gson
import com.google.gson.JsonObject
import java.util.concurrent.TimeUnit
import com.xiaozhi.r1.util.TrustManagerUtil

class GeminiProxy {
    private val client = OkHttpClient.Builder()
        .apply { TrustManagerUtil.applyUnsafeSslIfNecessary(this) }
        .connectTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()

    // Context memory queue
    private val history = mutableListOf<JsonObject>()
    private val MAX_HISTORY = 10 // Maintains last 5 turns (user + model)

    fun generateContent(apiKey: String, prompt: String, systemInstruction: String): String {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$apiKey"

        val userContent = JsonObject().apply {
            addProperty("role", "user")
            val partsArray = com.google.gson.JsonArray()
            partsArray.add(JsonObject().apply { addProperty("text", prompt) })
            add("parts", partsArray)
        }

        val requestJson = JsonObject().apply {
            val systemInstructionObj = JsonObject().apply {
                val partsArray = com.google.gson.JsonArray()
                partsArray.add(JsonObject().apply { addProperty("text", systemInstruction) })
                add("parts", partsArray)
            }
            add("systemInstruction", systemInstructionObj)

            val contentsArray = com.google.gson.JsonArray()
            
            // Inject context history
            for (msg in history) {
                contentsArray.add(msg)
            }
            
            contentsArray.add(userContent)
            add("contents", contentsArray)
        }

        val requestBody = RequestBody.create(MediaType.parse("application/json"), requestJson.toString())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                val errorBody = response.body()?.string()
                if (errorBody != null) {
                    try {
                        val errorObj = gson.fromJson(errorBody, JsonObject::class.java).getAsJsonObject("error")
                        val message = errorObj.get("message").asString
                        return "Error: $message"
                    } catch (e: Exception) {
                        return "Error: HTTP ${response.code()} - $errorBody"
                    }
                }
                return "Error: HTTP ${response.code()}"
            }
            
            val responseBody = response.body()?.string() ?: return "Error: Empty response"
            
            // Parse response
            val rootObj = gson.fromJson(responseBody, JsonObject::class.java)
            val candidates = rootObj.getAsJsonArray("candidates")
            if (candidates != null && candidates.size() > 0) {
                val content = candidates.get(0).asJsonObject.getAsJsonObject("content")
                val parts = content.getAsJsonArray("parts")
                if (parts != null && parts.size() > 0) {
                    val replyText = parts.get(0).asJsonObject.get("text").asString
                    
                    // Update memory queue
                    history.add(userContent)
                    val modelContent = JsonObject().apply {
                        addProperty("role", "model")
                        val modelParts = com.google.gson.JsonArray()
                        modelParts.add(JsonObject().apply { addProperty("text", replyText) })
                        add("parts", modelParts)
                    }
                    history.add(modelContent)
                    
                    // Sliding window
                    while (history.size > MAX_HISTORY) {
                        history.removeAt(0)
                    }
                    
                    return replyText
                }
            }
            return "No text received"
        } catch (e: Exception) {
            e.printStackTrace()
            return "Error: ${e.message}"
        }
    }
    
    fun clearMemory() {
        history.clear()
    }
}
