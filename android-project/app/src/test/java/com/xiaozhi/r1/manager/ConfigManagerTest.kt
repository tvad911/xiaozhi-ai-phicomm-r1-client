package com.xiaozhi.r1.manager

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.Base64 as JavaBase64

class ConfigManagerTest {

    private lateinit var mockContext: Context
    private lateinit var mockPrefs: SharedPreferences
    private lateinit var mockEditor: SharedPreferences.Editor
    
    // In-memory store to simulate SharedPreferences
    private val prefsStore = mutableMapOf<String, String>()

    @Before
    fun setup() {
        mockContext = mockk()
        mockPrefs = mockk()
        mockEditor = mockk()

        // Mock SharedPreferences behavior
        every { mockContext.getSharedPreferences(any(), any()) } returns mockPrefs
        every { mockContext.contentResolver } returns mockk(relaxed = true)
        every { mockPrefs.edit() } returns mockEditor
        
        every { mockPrefs.getString(any(), any()) } answers {
            val key = firstArg<String>()
            val defValue = secondArg<String?>()
            prefsStore[key] ?: defValue
        }

        every { mockEditor.putString(any(), any()) } answers {
            val key = firstArg<String>()
            val value = secondArg<String>()
            prefsStore[key] = value
            mockEditor
        }
        
        every { mockEditor.remove(any()) } answers {
            val key = firstArg<String>()
            prefsStore.remove(key)
            mockEditor
        }

        every { mockEditor.apply() } returns Unit

        // Mock Settings.Secure.getString so CryptoHelper doesn't crash on Android ID retrieval
        mockkStatic(android.provider.Settings.Secure::class)
        every { android.provider.Settings.Secure.getString(any(), any()) } returns "mock_android_id"

        // Mock Base64 for JVM
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
        unmockkStatic(android.provider.Settings.Secure::class)
        unmockkStatic(Base64::class)
        prefsStore.clear()
    }

    @Test
    fun testUpdateConfig_PartialUpdate() {
        // Initialize ConfigManager with clean mock
        val configManager = ConfigManager(mockContext)
        
        // Assert defaults
        assertEquals(false, configManager.currentConfig.isWebAuthEnabled)
        assertEquals("", configManager.currentConfig.webUiPin)
        assertEquals("wss://api.xiaozhi.me", configManager.currentConfig.serverUrl)

        // Do a partial update
        val updates = mapOf(
            "isWebAuthEnabled" to true,
            "webUiPin" to "123456",
            "serverUrl" to "wss://192.168.1.10"
        )
        configManager.updateConfig(updates)

        // Verify state is updated
        assertEquals(true, configManager.currentConfig.isWebAuthEnabled)
        assertEquals("123456", configManager.currentConfig.webUiPin)
        assertEquals("wss://192.168.1.10", configManager.currentConfig.serverUrl)
        
        // Ensure other fields were NOT overridden
        assertEquals("Hey Google", configManager.currentConfig.wakeWord) // default is Hey Google

        // Re-instantiate ConfigManager to verify data was persisted to SharedPreferences correctly
        val configManager2 = ConfigManager(mockContext)
        assertEquals(true, configManager2.currentConfig.isWebAuthEnabled)
        assertEquals("123456", configManager2.currentConfig.webUiPin)
    }

    @Test
    fun testPlaintextConfigMigration() {
        // Setup raw JSON config without encryption (legacy)
        val rawJson = """{"isWebAuthEnabled":false,"webUiPin":"9999","useStandaloneMode":true,"serverUrl":"wss://legacy.com","picovoiceAccessKey":"","wakeWord":"jarvis","llmProvider":"gemini","llmApiKey":"","ttsProvider":"google_cloud","ttsApiKey":"","activePersonaId":"default","personas":[],"voiceSpeed":1.0,"activationSensitivity":70,"silenceTimeout":1500,"macAddress":"","otaVersion":"1.5.2"}"""
        prefsStore["config_json"] = rawJson
        
        // Instantiating ConfigManager should trigger migration
        val configManager = ConfigManager(mockContext)
        
        // Verify state is loaded from raw
        assertEquals("jarvis", configManager.currentConfig.wakeWord)
        assertEquals("9999", configManager.currentConfig.webUiPin)
        
        // Verify it was migrated
        assertTrue("Legacy key config_json should be deleted", !prefsStore.containsKey("config_json"))
        assertTrue("Encrypted key should exist", prefsStore.containsKey("config_json_encrypted"))
    }
}
