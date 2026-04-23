package com.xiaozhi.r1.manager

import android.content.Context
import com.xiaozhi.r1.util.ShellExecutor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

class OtaManager(private val context: Context) {
    private val client = OkHttpClient()

    suspend fun downloadAndInstallApk(url: String, progressCallback: (Int) -> Unit): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) return@withContext false
            
            val body = response.body ?: return@withContext false
            val contentLength = body.contentLength()
            
            val apkFile = File(context.cacheDir, "update.apk")
            val inputStream = body.byteStream()
            val outputStream = FileOutputStream(apkFile)
            
            val buffer = ByteArray(4096)
            var bytesRead: Int
            var totalRead: Long = 0
            
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
                totalRead += bytesRead
                
                if (contentLength > 0) {
                    val progress = ((totalRead * 100) / contentLength).toInt()
                    progressCallback(progress)
                }
            }
            
            outputStream.flush()
            outputStream.close()
            inputStream.close()
            
            // Perform silent install since we have root access on R1
            return@withContext installApkSilently(apkFile.absolutePath)
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }

    private fun installApkSilently(apkPath: String): Boolean {
        val command = "pm install -r $apkPath"
        val output = ShellExecutor.executeRootCommand(command)
        return output.contains("Success", ignoreCase = true)
    }
}
