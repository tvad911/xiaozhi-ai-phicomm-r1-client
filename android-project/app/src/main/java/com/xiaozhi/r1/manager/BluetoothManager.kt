package com.xiaozhi.r1.manager

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.Context

data class BluetoothDeviceInfo(
    val id: String,
    val name: String,
    val connected: Boolean,
    val type: String = "audio",
    val pairingStatus: String = "none"
)

@SuppressLint("MissingPermission")
class BluetoothManager(private val context: Context) {
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()

    fun isEnabled(): Boolean {
        return bluetoothAdapter?.isEnabled == true
    }

    fun getBondedDevices(): List<BluetoothDeviceInfo> {
        if (!isEnabled()) return emptyList()
        
        val pairedDevices: Set<BluetoothDevice>? = bluetoothAdapter?.bondedDevices
        return pairedDevices?.map { device ->
            BluetoothDeviceInfo(
                id = device.address,
                name = device.name ?: "Unknown",
                connected = false, // We'd need BluetoothA2dp or reflection to check actual connection
                pairingStatus = "paired"
            )
        } ?: emptyList()
    }

    fun startDiscovery() {
        if (!isEnabled()) return
        if (bluetoothAdapter?.isDiscovering == true) {
            bluetoothAdapter.cancelDiscovery()
        }
        bluetoothAdapter?.startDiscovery()
    }

    fun unpairDevice(macAddress: String): Boolean {
        try {
            val device = bluetoothAdapter?.getRemoteDevice(macAddress)
            val method = device?.javaClass?.getMethod("removeBond")
            method?.invoke(device)
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }
}
