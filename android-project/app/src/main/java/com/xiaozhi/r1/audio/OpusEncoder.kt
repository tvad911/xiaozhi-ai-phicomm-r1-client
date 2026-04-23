package com.xiaozhi.r1.audio

class OpusEncoder {
    private var encoderPointer: Long = 0

    init {
        System.loadLibrary("opus_jni")
    }

    external fun createEncoder(sampleRate: Int, channels: Int, application: Int): Long
    external fun encode(encoder: Long, pcm: ShortArray, frameSize: Int, outOpus: ByteArray): Int
    external fun destroyEncoder(encoder: Long)

    fun init(sampleRate: Int = 16000, channels: Int = 1) {
        // 2048 corresponds to OPUS_APPLICATION_VOIP
        encoderPointer = createEncoder(sampleRate, channels, 2048)
    }

    fun encodeFrame(pcmFrame: ShortArray): ByteArray? {
        if (encoderPointer == 0L) return null
        
        // Max Opus packet size
        val outBuffer = ByteArray(4000)
        val bytesEncoded = encode(encoderPointer, pcmFrame, pcmFrame.size, outBuffer)
        
        if (bytesEncoded > 0) {
            return outBuffer.copyOfRange(0, bytesEncoded)
        }
        return null
    }

    fun release() {
        if (encoderPointer != 0L) {
            destroyEncoder(encoderPointer)
            encoderPointer = 0
        }
    }
}
