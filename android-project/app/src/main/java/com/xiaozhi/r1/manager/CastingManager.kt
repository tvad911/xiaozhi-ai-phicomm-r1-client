package com.xiaozhi.r1.manager

import com.xiaozhi.r1.util.ShellExecutor
import android.util.Log

class CastingManager {
    var airplayEnabled: Boolean = true
        private set
        
    var dlnaEnabled: Boolean = true
        private set
        
    var deviceName: String = "Xiaozhi R1"
        private set

    init {
        // Assume daemons are started on boot if enabled
        applyConfig()
    }

    fun setAirplay(enabled: Boolean) {
        airplayEnabled = enabled
        if (enabled) {
            // shairport-sync is a popular open-source AirPlay audio player
            ShellExecutor.executeRootCommand("start shairport-sync -a \"$deviceName\"")
            Log.d("CastingManager", "AirPlay (shairport-sync) started")
        } else {
            ShellExecutor.executeRootCommand("killall shairport-sync")
            Log.d("CastingManager", "AirPlay stopped")
        }
    }

    fun setDlna(enabled: Boolean) {
        dlnaEnabled = enabled
        if (enabled) {
            // upmpdcli or gmrender-resurrect
            ShellExecutor.executeRootCommand("start gmediarender -f \"$deviceName\"")
            Log.d("CastingManager", "DLNA started")
        } else {
            ShellExecutor.executeRootCommand("killall gmediarender")
            Log.d("CastingManager", "DLNA stopped")
        }
    }

    fun setDeviceName(name: String) {
        deviceName = name
        // Restart services to apply new name
        applyConfig()
    }

    private fun applyConfig() {
        setAirplay(airplayEnabled)
        setDlna(dlnaEnabled)
    }
}
