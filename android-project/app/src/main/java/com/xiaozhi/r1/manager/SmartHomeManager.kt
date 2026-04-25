package com.xiaozhi.r1.manager

import android.util.Log
import org.eclipse.paho.client.mqttv3.IMqttActionListener
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.IMqttToken
import org.eclipse.paho.client.mqttv3.MqttAsyncClient
import org.eclipse.paho.client.mqttv3.MqttCallback
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import org.json.JSONObject

data class SmartDevice(
    val id: String,
    val name: String,
    val type: String, // "light", "climate", "cover"
    val state: String, // "on", "off", "open", "closed"
    val temp: Float? = null
)

class SmartHomeManager {
    private var mqttClient: MqttAsyncClient? = null
    
    var mqttStatus: String = "connected" // Default connected for demonstration
    private val devices = mutableMapOf<String, SmartDevice>()
    
    init {
        // Populate with real-like data representing Home Assistant integration
        devices["dev1"] = SmartDevice("dev1", "Living Room Light", "light", "off")
        devices["dev2"] = SmartDevice("dev2", "Air Conditioner", "climate", "on", 24.0f)
        devices["dev3"] = SmartDevice("dev3", "Curtains", "cover", "open")
    }

    var onMessageReceived: ((String, String) -> Unit)? = null

    fun connect(brokerUrl: String, clientId: String, username: String?, password: String?) {
        try {
            mqttStatus = "connecting"
            Log.d("SmartHomeManager", "Connecting to MQTT broker: $brokerUrl")
            
            mqttClient = MqttAsyncClient(brokerUrl, clientId, MemoryPersistence())
            
            val options = MqttConnectOptions()
            options.isAutomaticReconnect = true
            options.isCleanSession = true
            options.connectionTimeout = 10
            if (!username.isNullOrEmpty()) options.userName = username
            if (!password.isNullOrEmpty()) options.password = password.toCharArray()
            
            mqttClient?.setCallback(object : MqttCallback {
                override fun connectionLost(cause: Throwable?) {
                    mqttStatus = "disconnected"
                    Log.w("SmartHomeManager", "MQTT Connection lost")
                }

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    topic?.let { t ->
                        message?.let { m ->
                            val payload = String(m.payload)
                            handleIncomingMessage(t, payload)
                        }
                    }
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {}
            })
            
            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    mqttStatus = "connected"
                    Log.i("SmartHomeManager", "MQTT Connected")
                    subscribe("homeassistant/+/+/state")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    mqttStatus = "disconnected"
                    Log.e("SmartHomeManager", "MQTT Connection failed", exception)
                }
            })
        } catch (e: Exception) {
            e.printStackTrace()
            mqttStatus = "disconnected"
        }
    }

    private fun handleIncomingMessage(topic: String, payload: String) {
        onMessageReceived?.invoke(topic, payload)
        // Topic format: homeassistant/[type]/[id]/state
        val parts = topic.split("/")
        if (parts.size >= 4) {
            val type = parts[1]
            val id = parts[2]
            
            val device = devices[id]
            if (device != null) {
                // simple assumption: payload is raw string state
                devices[id] = device.copy(state = payload.lowercase())
            } else {
                // Auto discovery placeholder
                devices[id] = SmartDevice(id, "Discovered $id", type, payload.lowercase())
            }
        }
    }

    private fun subscribe(topic: String) {
        try {
            mqttClient?.subscribe(topic, 1)
            Log.d("SmartHomeManager", "Subscribed to $topic")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun publish(topic: String, payload: String) {
        try {
            if (mqttClient?.isConnected == true) {
                val message = MqttMessage(payload.toByteArray())
                message.qos = 1
                mqttClient?.publish(topic, message)
                Log.d("SmartHomeManager", "Published to $topic: $payload")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun toggleDevice(deviceId: String) {
        val device = devices[deviceId] ?: return
        val newState = if (device.state == "on" || device.state == "open") "off" else "on"
        
        // Update local state optimistic
        devices[deviceId] = device.copy(state = newState)
        
        // Send command to MQTT broker
        val commandTopic = "homeassistant/${device.type}/$deviceId/set"
        publish(commandTopic, newState.uppercase())
    }

    fun getDevices(): List<SmartDevice> {
        return devices.values.toList()
    }

    fun disconnect() {
        try {
            mqttClient?.disconnect()
            mqttClient = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        mqttStatus = "disconnected"
    }
}
