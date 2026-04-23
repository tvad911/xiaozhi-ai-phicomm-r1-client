package com.xiaozhi.r1.media

import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class TrackInfo(
    val id: String,
    val title: String,
    val uploader: String,
    val duration: Long,
    val thumbnailUrl: String
)

class PipedClient {
    private val client = OkHttpClient()
    private val gson = Gson()
    // Using a public instances list. In production, we'd cycle through fallback instances.
    private val BASE_URL = "https://pipedapi.kavin.rocks"

    suspend fun search(query: String): List<TrackInfo> = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/search?q=${java.net.URLEncoder.encode(query, "UTF-8")}&filter=music_songs"
        val request = Request.Builder().url(url).build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return@withContext emptyList()
            
            val responseBody = response.body?.string() ?: return@withContext emptyList()
            val root = gson.fromJson(responseBody, JsonObject::class.java)
            val items = root.getAsJsonArray("items")
            
            val tracks = mutableListOf<TrackInfo>()
            for (i in 0 until items.size()) {
                val item = items.get(i).asJsonObject
                if (item.get("type").asString == "stream") {
                    tracks.add(
                        TrackInfo(
                            id = item.get("url").asString.replace("/watch?v=", ""),
                            title = item.get("title").asString,
                            uploader = item.get("uploaderName").asString,
                            duration = item.get("duration").asLong,
                            thumbnailUrl = item.get("thumbnail").asString
                        )
                    )
                }
            }
            return@withContext tracks
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext emptyList()
        }
    }

    suspend fun getStreamUrl(videoId: String): String? = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/streams/$videoId"
        val request = Request.Builder().url(url).build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            
            val responseBody = response.body?.string() ?: return@withContext null
            val root = gson.fromJson(responseBody, JsonObject::class.java)
            val audioStreams = root.getAsJsonArray("audioStreams")
            
            if (audioStreams != null && audioStreams.size() > 0) {
                // Return highest bitrate audio stream
                val stream = audioStreams.get(0).asJsonObject
                return@withContext stream.get("url").asString
            }
            return@withContext null
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext null
        }
    }
}
