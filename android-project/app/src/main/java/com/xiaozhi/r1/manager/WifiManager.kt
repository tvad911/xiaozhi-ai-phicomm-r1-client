package com.xiaozhi.r1.manager

import android.content.Context
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager as AndroidWifiManager

data class WifiNetworkInfo(
    val ssid: String,
    val signal: Int,
    val security: String,
    val connected: Boolean,
    val saved: Boolean
)

class WifiManager(context: Context) {
    private val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as AndroidWifiManager

    fun getScanResults(): List<WifiNetworkInfo> {
        val currentConnection = wifiManager.connectionInfo
        val currentSsid = currentConnection?.ssid?.replace("\"", "")
        
        val results = wifiManager.scanResults
        return results.map { scanResult ->
            val ssid = scanResult.SSID
            WifiNetworkInfo(
                ssid = ssid,
                signal = scanResult.level,
                security = scanResult.capabilities,
                connected = ssid == currentSsid,
                saved = isNetworkSaved(ssid)
            )
        }.distinctBy { it.ssid }.filter { it.ssid.isNotEmpty() }
    }

    fun startScan() {
        wifiManager.startScan()
    }

    fun connectToNetwork(ssid: String, password: String?): Boolean {
        // Find existing config
        val configuredNetworks = wifiManager.configuredNetworks
        var existingConfig = configuredNetworks?.find { it.SSID == "\"$ssid\"" }

        val networkId: Int
        if (existingConfig != null) {
            networkId = existingConfig.networkId
        } else {
            val conf = WifiConfiguration()
            conf.SSID = "\"$ssid\""
            
            if (password.isNullOrEmpty()) {
                conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE)
            } else {
                conf.preSharedKey = "\"$password\""
            }
            
            networkId = wifiManager.addNetwork(conf)
        }

        if (networkId != -1) {
            wifiManager.disconnect()
            wifiManager.enableNetwork(networkId, true)
            return wifiManager.reconnect()
        }
        return false
    }

    private fun isNetworkSaved(ssid: String): Boolean {
        return wifiManager.configuredNetworks?.any { it.SSID == "\"$ssid\"" } == true
    }
}
