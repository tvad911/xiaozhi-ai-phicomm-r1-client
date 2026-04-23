package com.xiaozhi.r1.audio

class OpusDecoder {
    private var decoderPointer: Long = 0

    init {
        System.loadLibrary("opus_jni")
    }

    external fun createDecoder(sampleRate: Int, channels: Int): Long
    external fun decode(decoder: Long, opus: ByteArray, opusLen: Int, outPcm: ShortArray, frameSize: Int): Int
    external fun destroyDecoder(decoder: Long)

    fun init(sampleRate: Int = 16000, channels: Int = 1) {
        decoderPointer = createDecoder(sampleRate, channels)
    }

    fun decodeFrame(opusPacket: ByteArray): ShortArray? {
        if (decoderPointer == 0L) return null
        
        // 16kHz, 60ms maximum frame size = 960 samples
        val outBuffer = ShortArray(960)
        val samplesDecoded = decode(decoderPointer, opusPacket, opusPacket.size, outBuffer, 960)
        
        if (samplesDecoded > 0) {
            return outBuffer.copyOfRange(0, samplesDecoded)
        }
        return null
    }

    fun release() {
        if (decoderPointer != 0L) {
            destroyDecoder(decoderPointer)
            decoderPointer = 0
        }
    }
}
