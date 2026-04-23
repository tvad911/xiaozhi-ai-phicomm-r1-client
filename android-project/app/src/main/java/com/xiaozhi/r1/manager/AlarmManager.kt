package com.xiaozhi.r1.manager

import android.app.AlarmManager as AndroidAlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import java.util.Calendar

data class Alarm(
    val id: String,
    val time: String, // HH:mm
    val label: String,
    val enabled: Boolean,
    val days: List<String>
)

data class Timer(
    val id: String,
    val label: String,
    val durationSeconds: Int,
    var remainingSeconds: Int,
    var active: Boolean
)

class AlarmManager(private val context: Context) {
    private val androidAlarmManager = context.getSystemService(Context.ALARM_SERVICE) as AndroidAlarmManager
    
    private val alarms = mutableListOf<Alarm>()
    private val timers = mutableListOf<Timer>()

    // Set an alarm using exact scheduling
    fun scheduleAlarm(alarm: Alarm) {
        if (!alarm.enabled) return

        val parts = alarm.time.split(":")
        if (parts.size != 2) return
        val hour = parts[0].toIntOrNull() ?: return
        val minute = parts[1].toIntOrNull() ?: return

        val calendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            
            // If the time has already passed today, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        // Action for broadcast receiver
        val intent = Intent("com.xiaozhi.r1.ALARM_TRIGGERED").apply {
            putExtra("ALARM_ID", alarm.id)
            setPackage(context.packageName)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarm.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Exact alarm for reliable wake up
        androidAlarmManager.setExactAndAllowWhileIdle(
            AndroidAlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            pendingIntent
        )
    }

    fun cancelAlarm(alarmId: String) {
        val intent = Intent("com.xiaozhi.r1.ALARM_TRIGGERED").apply {
            setPackage(context.packageName)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        androidAlarmManager.cancel(pendingIntent)
    }

    fun syncAlarms(newAlarms: List<Alarm>) {
        alarms.forEach { cancelAlarm(it.id) }
        alarms.clear()
        alarms.addAll(newAlarms)
        alarms.forEach { scheduleAlarm(it) }
    }
}
