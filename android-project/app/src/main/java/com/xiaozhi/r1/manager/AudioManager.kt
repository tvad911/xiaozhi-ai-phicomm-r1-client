package com.xiaozhi.r1.manager

import android.content.Context
import android.media.audiofx.Equalizer
import android.media.AudioManager as AndroidAudioManager

class AudioManager(private val context: Context) {
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AndroidAudioManager
    private var equalizer: Equalizer? = null

    init {
        try {
            // Attach equalizer to global output session (0) or specific mediaplayer session
            equalizer = Equalizer(0, 0)
            equalizer?.enabled = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun setVolume(level: Int) {
        val maxVolume = audioManager.getStreamMaxVolume(AndroidAudioManager.STREAM_MUSIC)
        val targetVolume = (level / 100f * maxVolume).toInt()
        audioManager.setStreamVolume(AndroidAudioManager.STREAM_MUSIC, targetVolume, 0)
    }

    fun getVolume(): Int {
        val maxVolume = audioManager.getStreamMaxVolume(AndroidAudioManager.STREAM_MUSIC)
        val currentVolume = audioManager.getStreamVolume(AndroidAudioManager.STREAM_MUSIC)
        return ((currentVolume.toFloat() / maxVolume) * 100).toInt()
    }

    fun setEqBands(bass: Short, mid: Short, treble: Short) {
        equalizer?.let { eq ->
            val numBands = eq.numberOfBands
            if (numBands >= 5) {
                // Typical 5-band EQ mapping: 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
                // Map bass, mid, treble roughly to bands
                val minEq = eq.bandLevelRange[0]
                val maxEq = eq.bandLevelRange[1]
                
                // Helper to scale -10..10 to minEq..maxEq
                val scale = { value: Short -> 
                    val normalized = (value + 10) / 20f
                    (minEq + normalized * (maxEq - minEq)).toInt().toShort()
                }

                try {
                    eq.setBandLevel(0, scale(bass))
                    eq.setBandLevel(1, scale((bass / 2).toShort()))
                    eq.setBandLevel(2, scale(mid))
                    eq.setBandLevel(3, scale((treble / 2).toShort()))
                    eq.setBandLevel(4, scale(treble))
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    fun release() {
        equalizer?.release()
    }
}
