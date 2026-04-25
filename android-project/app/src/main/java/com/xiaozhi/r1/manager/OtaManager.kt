package com.xiaozhi.r1.manager

import android.content.Context
import com.xiaozhi.r1.util.ShellExecutor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Intent
import kotlin.system.exitProcess
import com.xiaozhi.r1.util.TrustManagerUtil

class OtaManager(private val context: Context) {
    private val client = OkHttpClient.Builder().apply {
        TrustManagerUtil.applyUnsafeSslIfNecessary(this)
    }.build()

    suspend fun downloadAndInstallApk(url: String, progressCallback: (Int) -> Unit): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) return@withContext false
            
            val body = response.body() ?: return@withContext false
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
            val success = installApkSilently(apkFile.absolutePath)
            if (success) restartApp()
            return@withContext success
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }

    fun installFromUpload(inputStream: InputStream, fileName: String?): Boolean {
        try {
            val apkFile = File(context.cacheDir, fileName ?: "update_upload.apk")
            val outputStream = FileOutputStream(apkFile)
            val buffer = ByteArray(4096)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
            }
            outputStream.flush()
            outputStream.close()
            inputStream.close()
            val success = installApkSilently(apkFile.absolutePath)
            if (success) restartApp()
            return success
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    fun installApkSilently(apkPath: String): Boolean {
        val command = "pm install -r $apkPath"
        val output = ShellExecutor.executeRootCommand(command)
        return output.contains("Success", ignoreCase = true)
    }

    private fun restartApp() {
        try {
            val intent = Intent(context, com.xiaozhi.r1.MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 123456, intent, PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val mgr = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 1000, pendingIntent)
            exitProcess(0)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
