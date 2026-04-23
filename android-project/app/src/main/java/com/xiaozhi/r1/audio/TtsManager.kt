package com.xiaozhi.r1.audio

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import com.xiaozhi.r1.media.MusicPlayer
import com.xiaozhi.r1.media.TrackInfo
import java.net.URLEncoder
import java.util.Locale

class TtsManager(private val context: Context, private val musicPlayer: MusicPlayer) : TextToSpeech.OnInitListener {
    private var nativeTts: TextToSpeech? = null
    private var isNativeTtsReady = false

    init {
        nativeTts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = nativeTts?.setLanguage(Locale("vi", "VN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("TtsManager", "Vietnamese language is not supported on native TTS")
            } else {
                isNativeTtsReady = true
            }
        } else {
            Log.e("TtsManager", "Native TTS initialization failed")
        }
    }

    fun speak(text: String, preferCloud: Boolean = true) {
        if (text.isEmpty()) return

        if (preferCloud) {
            try {
                // Sử dụng Google Translate TTS API (Miễn phí, chất lượng giọng khá tốt)
                // Lưu ý: Nếu văn bản quá dài, API này có thể chặn. Với ứng dụng thực tế,
                // nên dùng Google Cloud TTS chính thức hoặc chia nhỏ câu.
                val encodedText = URLEncoder.encode(text, "UTF-8")
                val url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=$encodedText"
                
                val track = TrackInfo(
                    id = "tts_${System.currentTimeMillis()}",
                    title = "Xiaozhi AI Response",
                    uploader = "TTS System",
                    duration = 0L,
                    thumbnailUrl = "" // No thumbnail for TTS
                )
                
                // Phát âm thanh qua ExoPlayer (sẽ tự động stream và đệm buffer)
                musicPlayer.play(track, url)
                return
            } catch (e: Exception) {
                e.printStackTrace()
                Log.w("TtsManager", "Cloud TTS failed, falling back to Native TTS")
            }
        }

        // Fallback: Sử dụng Native Android TTS
        if (isNativeTtsReady) {
            nativeTts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_id_${System.currentTimeMillis()}")
        }
    }

    fun stop() {
        nativeTts?.stop()
        musicPlayer.stop()
    }

    fun release() {
        nativeTts?.stop()
        nativeTts?.shutdown()
    }
}
