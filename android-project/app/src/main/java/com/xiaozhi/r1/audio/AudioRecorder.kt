package com.xiaozhi.r1.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlin.math.sqrt

class AudioRecorder {
    private val SAMPLE_RATE = 16000
    private val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
    private val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    
    // Voice Activity Detection Threshold
    private val SILENCE_THRESHOLD = 500.0

    @SuppressLint("MissingPermission")
    fun startRecording(): Flow<ByteArray> = flow {
        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val bufferSize = Math.max(minBufferSize, SAMPLE_RATE / 10) // 100ms buffer (1600 samples)
        
        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT,
            bufferSize
        )

        audioRecord?.startRecording()
        isRecording = true
        
        val buffer = ByteArray(bufferSize)
        val shortBuffer = ShortArray(bufferSize / 2)
        
        while (isRecording) {
            val readSize = audioRecord?.read(buffer, 0, buffer.size) ?: 0
            if (readSize > 0) {
                // Convert bytes to shorts for RMS calculation
                java.nio.ByteBuffer.wrap(buffer).order(java.nio.ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(shortBuffer)
                
                // Calculate RMS energy to detect Voice Activity
                var sum = 0.0
                for (i in 0 until (readSize / 2)) {
                    val sample = shortBuffer[i].toDouble()
                    sum += sample * sample
                }
                val rms = sqrt(sum / (readSize / 2))
                
                val isSpeech = rms > SILENCE_THRESHOLD
                
                // In a real app, we would use a proper VAD library (like WebRTC VAD)
                // Here we just pass the raw data, and maybe flag silence
                emit(buffer.copyOf(readSize))
            }
        }
    }

    fun stopRecording() {
        isRecording = false
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }
}
