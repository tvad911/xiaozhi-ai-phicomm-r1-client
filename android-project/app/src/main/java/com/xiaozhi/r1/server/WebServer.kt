package com.xiaozhi.r1.server

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import java.io.InputStream

class WebServer(private val context: Context, port: Int) : NanoHTTPD(port) {
    private val apiHandler = ApiHandler(context)

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        
        // Setup CORS
        val headers = mutableMapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers" to "Content-Type, X-Pin-Auth"
        )
        
        if (session.method == Method.OPTIONS) {
            val response = newFixedLengthResponse(Response.Status.OK, MIME_PLAINTEXT, "")
            headers.forEach { (k, v) -> response.addHeader(k, v) }
            return response
        }

        return when {
            uri.startsWith("/api/") -> {
                val response = apiHandler.handleRequest(session)
                headers.forEach { (k, v) -> response.addHeader(k, v) }
                response
            }
            else -> serveStaticFile(uri)
        }
    }

    private fun serveStaticFile(uri: String): Response {
        // Prevent Path Traversal
        if (uri.contains("..")) {
            return newFixedLengthResponse(Response.Status.FORBIDDEN, MIME_PLAINTEXT, "403 Forbidden")
        }

        var path = uri.removePrefix("/")
        if (path.isEmpty() || !path.contains(".")) {
            path = "index.html"
        }

        return try {
            val inputStream: InputStream = context.assets.open("web/$path")
            val mimeType = getMimeTypeForFile(path)
            newChunkedResponse(Response.Status.OK, mimeType, inputStream)
        } catch (e: Exception) {
            if (path != "index.html") {
                // Fallback to index.html for SPA routing
                try {
                    val fallbackStream = context.assets.open("web/index.html")
                    newChunkedResponse(Response.Status.OK, "text/html", fallbackStream)
                } catch (e2: Exception) {
                    newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found")
                }
            } else {
                newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found")
            }
        }
    }
}
