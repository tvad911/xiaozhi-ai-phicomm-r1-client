package com.xiaozhi.r1.util

import android.annotation.SuppressLint
import android.content.Context
import android.provider.Settings
import android.util.Base64
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class CryptoHelper(context: Context?, testAndroidId: String? = null) {

    private val secretKey: SecretKeySpec
    private val iv: IvParameterSpec

    init {
        // Derive a consistent key based on Android ID so it's bound to the specific device
        val androidId = testAndroidId ?: if (context != null) {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "fallback_id_12345"
        } else {
            "fallback_id_12345"
        }
        
        val seed = "xiaozhi_r1_$androidId"
        
        // Hash the seed to get exactly 32 bytes (256 bits) for AES
        val md = MessageDigest.getInstance("SHA-256")
        val keyBytes = md.digest(seed.toByteArray(Charsets.UTF_8))
        secretKey = SecretKeySpec(keyBytes, "AES")

        // Use a static IV for simplicity since the key is bound to the device and the file 
        // doesn't need randomized IVs for our threat model (prevent plain text extraction).
        val ivBytes = md.digest("static_iv_for_r1".toByteArray(Charsets.UTF_8)).copyOfRange(0, 16)
        iv = IvParameterSpec(ivBytes)
    }

    fun encrypt(plainText: String): String {
        try {
            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv)
            val encryptedBytes = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
            return Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            e.printStackTrace()
            return ""
        }
    }

    fun decrypt(cipherText: String): String {
        try {
            if (cipherText.isEmpty()) return ""
            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            cipher.init(Cipher.DECRYPT_MODE, secretKey, iv)
            val decodedBytes = Base64.decode(cipherText, Base64.NO_WRAP)
            val decryptedBytes = cipher.doFinal(decodedBytes)
            return String(decryptedBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            e.printStackTrace()
            // If decryption fails (e.g., plain text was saved before encryption was enabled), 
            // return the plain text as fallback.
            return cipherText
        }
    }
}
