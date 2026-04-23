package com.xiaozhi.r1.manager

import com.xiaozhi.r1.util.ShellExecutor
import android.graphics.Color

class LedManager {
    // Phicomm R1 specific LED paths
    private val LED_PATH = "/sys/class/leds"

    fun setMode(mode: String) {
        when (mode) {
            "off" -> executeLedCommand("echo 0 > $LED_PATH/brightness")
            "on" -> executeLedCommand("echo 255 > $LED_PATH/brightness")
            "music" -> {
                // Typical R1 logic: set trigger to audio-based if supported by kernel
                executeLedCommand("echo timer > $LED_PATH/trigger")
            }
        }
    }

    fun setColor(hexColor: String) {
        try {
            val color = Color.parseColor(hexColor)
            val r = Color.red(color)
            val g = Color.green(color)
            val b = Color.blue(color)
            
            // Depends on R1 exact kernel node for RGB, e.g.
            executeLedCommand("echo $r > $LED_PATH/red/brightness")
            executeLedCommand("echo $g > $LED_PATH/green/brightness")
            executeLedCommand("echo $b > $LED_PATH/blue/brightness")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun executeLedCommand(cmd: String) {
        ShellExecutor.executeRootCommand(cmd)
    }
}
