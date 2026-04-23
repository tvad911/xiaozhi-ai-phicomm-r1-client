package com.xiaozhi.r1.server

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import com.google.gson.JsonObject

class GeminiProxy {
    private val client = OkHttpClient()
    private val gson = Gson()
    private val GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE" // Ideally fetched from ConfigManager/SharedPreferences

    fun generateContent(prompt: String, systemInstruction: String): String {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY"

        // Build the request JSON structure expected by Gemini API
        val requestJson = JsonObject().apply {
            val systemInstructionObj = JsonObject().apply {
                val partsArray = com.google.gson.JsonArray()
                partsArray.add(JsonObject().apply { addProperty("text", systemInstruction) })
                add("parts", partsArray)
            }
            add("systemInstruction", systemInstructionObj)

            val contentsArray = com.google.gson.JsonArray()
            val userContent = JsonObject().apply {
                addProperty("role", "user")
                val partsArray = com.google.gson.JsonArray()
                partsArray.add(JsonObject().apply { addProperty("text", prompt) })
                add("parts", partsArray)
            }
            contentsArray.add(userContent)
            add("contents", contentsArray)
        }

        val requestBody = requestJson.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return "Error: HTTP ${response.code}"
            }
            val responseBody = response.body?.string() ?: return "Error: Empty response"
            
            // Parse response
            val rootObj = gson.fromJson(responseBody, JsonObject::class.java)
            val candidates = rootObj.getAsJsonArray("candidates")
            if (candidates != null && candidates.size() > 0) {
                val content = candidates.get(0).asJsonObject.getAsJsonObject("content")
                val parts = content.getAsJsonArray("parts")
                if (parts != null && parts.size() > 0) {
                    return parts.get(0).asJsonObject.get("text").asString
                }
            }
            return "No text received"
        } catch (e: Exception) {
            e.printStackTrace()
            return "Error: ${e.message}"
        }
    }
}
