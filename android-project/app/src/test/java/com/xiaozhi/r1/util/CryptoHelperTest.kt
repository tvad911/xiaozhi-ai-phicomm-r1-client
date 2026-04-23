package com.xiaozhi.r1.util

import android.util.Base64
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Before
import org.junit.Test
import java.util.Base64 as JavaBase64

class CryptoHelperTest {

    @Before
    fun setup() {
        // Mock android.util.Base64 to use java.util.Base64 for JVM testing
        mockkStatic(Base64::class)
        every { Base64.encodeToString(any(), any()) } answers {
            val bytes = firstArg<ByteArray>()
            JavaBase64.getEncoder().encodeToString(bytes)
        }
        every { Base64.decode(any<String>(), any()) } answers {
            val str = firstArg<String>()
            JavaBase64.getDecoder().decode(str)
        }
    }

    @After
    fun teardown() {
        unmockkStatic(Base64::class)
    }

    @Test
    fun testEncryptionAndDecryption() {
        val helper = CryptoHelper(null, "test_android_id")
        
        val plainText = "my_super_secret_api_key_123"
        val encryptedText = helper.encrypt(plainText)
        
        assertNotEquals("Encrypted text should not match plain text", plainText, encryptedText)
        
        val decryptedText = helper.decrypt(encryptedText)
        assertEquals("Decrypted text should match original", plainText, decryptedText)
    }

    @Test
    fun testEmptyString() {
        val helper = CryptoHelper(null, "test_android_id")
        val encrypted = helper.encrypt("")
        val decrypted = helper.decrypt(encrypted)
        assertEquals("Empty string should be handled correctly", "", decrypted)
    }

    @Test
    fun testFallbackOnBadDecryption() {
        val helper = CryptoHelper(null, "test_android_id")
        // If we pass unencrypted text to decrypt, it fails Base64 decode or AES decrypt
        // Our CryptoHelper is designed to return the original text as a fallback
        val badCipher = "not_base64_encoded_string"
        val result = helper.decrypt(badCipher)
        assertEquals("Should return the badCipher itself as fallback", badCipher, result)
    }
}
