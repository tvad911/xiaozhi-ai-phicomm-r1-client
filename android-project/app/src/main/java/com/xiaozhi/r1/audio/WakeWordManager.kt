package com.xiaozhi.r1.audio

import android.content.Context
import android.util.Log
import ai.picovoice.porcupine.PorcupineManager
import ai.picovoice.porcupine.PorcupineException

class WakeWordManager(
    private val context: Context,
    private val accessKey: String,
    private val keyword: String = "hey google",
    private val onWakeWordDetected: () -> Unit
) {
    private var porcupineManager: PorcupineManager? = null

    fun start() {
        if (accessKey.isEmpty()) {
            Log.e("WakeWordManager", "Picovoice AccessKey is empty. WakeWord detection disabled.")
            return
        }

        try {
            val keywordEnum = when(keyword.lowercase()) {
                "hey google" -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.HEY_GOOGLE
                "alexa" -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.ALEXA
                "jarvis" -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.JARVIS
                "porcupine" -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.PORCUPINE
                "terminator" -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.TERMINATOR
                else -> ai.picovoice.porcupine.Porcupine.BuiltInKeyword.HEY_GOOGLE
            }

            porcupineManager = PorcupineManager.Builder()
                .setAccessKey(accessKey)
                .setKeyword(keywordEnum)
                .setSensitivity(0.7f)
                .build(context) { keywordIndex ->
                    if (keywordIndex == 0) {
                        Log.i("WakeWordManager", "Wake word detected: $keyword")
                        onWakeWordDetected()
                    }
                }

            porcupineManager?.start()
            Log.i("WakeWordManager", "Started listening for wake word: $keyword")
        } catch (e: PorcupineException) {
            Log.e("WakeWordManager", "Failed to initialize Porcupine", e)
        }
    }

    fun stop() {
        try {
            porcupineManager?.stop()
            porcupineManager?.delete()
            porcupineManager = null
            Log.i("WakeWordManager", "WakeWord listening stopped")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
