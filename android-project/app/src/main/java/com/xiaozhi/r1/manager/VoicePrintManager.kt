package com.xiaozhi.r1.manager

import android.content.Context

data class VoicePrint(
    val id: String,
    val name: String,
    val registeredDate: Long,
    val sampleCount: Int
)

class VoicePrintManager(private val context: Context) {
    private val voicePrints = mutableListOf<VoicePrint>()
    
    init {
        voicePrints.add(VoicePrint("vp_1", "Người dùng 1", System.currentTimeMillis() - 86400000, 5))
    }
    
    fun getVoicePrints(): List<VoicePrint> {
        return voicePrints.toList()
    }
    
    fun registerVoicePrint(name: String, samplePath: String): Boolean {
        val newVp = VoicePrint("vp_${System.currentTimeMillis()}", name, System.currentTimeMillis(), 1)
        voicePrints.add(newVp)
        return true
    }
    
    fun deleteVoicePrint(id: String): Boolean {
        return voicePrints.removeIf { it.id == id }
    }
}
