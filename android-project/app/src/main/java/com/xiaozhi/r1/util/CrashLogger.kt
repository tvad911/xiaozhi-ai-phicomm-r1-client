package com.xiaozhi.r1.util

import java.util.LinkedList

data class LogEntry(val timestamp: Long, val level: String, val tag: String, val message: String)

object CrashLogger {
    private const val MAX_ENTRIES = 500
    private val logs = LinkedList<LogEntry>()

    fun i(tag: String, message: String) = log("INFO", tag, message)
    fun w(tag: String, message: String) = log("WARN", tag, message)
    fun e(tag: String, message: String) = log("ERROR", tag, message)
    fun d(tag: String, message: String) = log("DEBUG", tag, message)

    fun log(level: String, tag: String, message: String) {
        synchronized(logs) {
            logs.addLast(LogEntry(System.currentTimeMillis(), level, tag, message))
            if (logs.size > MAX_ENTRIES) {
                logs.removeFirst()
            }
        }
    }

    fun getLogs(): List<LogEntry> {
        synchronized(logs) {
            return logs.toList()
        }
    }

    fun clear() {
        synchronized(logs) {
            logs.clear()
        }
    }
}
