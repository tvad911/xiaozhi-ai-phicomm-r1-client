package com.xiaozhi.r1

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.view.KeyEvent
import com.xiaozhi.r1.util.CrashLogger

class ButtonListener(private val mainService: MainService) : BroadcastReceiver() {
    private var lastKeyDownTime: Long = 0

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_MEDIA_BUTTON) {
            val keyEvent = intent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
            // On R1, the top button typically maps to MEDIA_PLAY_PAUSE or similar
            if (keyEvent != null) {
                when (keyEvent.action) {
                    KeyEvent.ACTION_DOWN -> {
                        if (keyEvent.repeatCount == 0) {
                            lastKeyDownTime = System.currentTimeMillis()
                        } else if (System.currentTimeMillis() - lastKeyDownTime > 2000 && keyEvent.repeatCount == 1) {
                            // Long press handled once
                            handleLongPress()
                            lastKeyDownTime = 0 // Prevent short press logic on up
                        }
                    }
                    KeyEvent.ACTION_UP -> {
                        if (lastKeyDownTime > 0) {
                            val duration = System.currentTimeMillis() - lastKeyDownTime
                            if (duration < 1000) {
                                handleShortPress()
                            }
                        }
                    }
                }
            }
        }
    }

    private fun handleShortPress() {
        CrashLogger.i("ButtonListener", "Short press detected")
        try {
            // Try to pause music or trigger wake word
            mainService.musicPlayer.playPause()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleLongPress() {
        CrashLogger.i("ButtonListener", "Long press detected")
        try {
            // Enter binding mode
            val code = mainService.getDeviceManager().generateBindingCode()
            mainService.transitionState(ProvisionState.STATE_WAIT_BIND)
            CrashLogger.i("ButtonListener", "Binding mode activated. Code: $code")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
