package com.xiaozhi.r1.util

import java.io.BufferedReader
import java.io.DataOutputStream
import java.io.InputStreamReader

object ShellExecutor {
    fun executeRootCommand(command: String): String {
        var output = ""
        try {
            val process = Runtime.getRuntime().exec("su")
            val os = DataOutputStream(process.outputStream)
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            
            os.writeBytes("$command\n")
            os.writeBytes("exit\n")
            os.flush()
            
            process.waitFor()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output += line + "\n"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            output = "Error: ${e.message}"
        }
        return output
    }
}
