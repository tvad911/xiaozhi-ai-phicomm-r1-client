package com.xiaozhi.r1

import android.content.Intent
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.app.Activity
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build

class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return false
            }

            override fun onReceivedError(view: WebView, errorCode: Int, description: String, failingUrl: String) {
                if (failingUrl == "http://localhost:8080" || failingUrl == "http://localhost:8080/") {
                    // Retry after 1 second
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        view.loadUrl(failingUrl)
                    }, 1000)
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val permissions = mutableListOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
            if (Build.VERSION.SDK_INT >= 31) { // Android 12
                permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
                permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            }
            if (Build.VERSION.SDK_INT >= 33) { // Android 13
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
            val missing = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
            if (missing.isNotEmpty()) {
                requestPermissions(missing.toTypedArray(), 100)
                return
            }
        }

        startAppServices()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        if (requestCode == 100) {
            startAppServices()
        }
    }

    private fun startAppServices() {
        try {
            val serviceIntent = Intent(this, MainService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Delay to wait for NanoHTTPD to start
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            webView.loadUrl("http://localhost:8080")
        }, 1500)
    }
}
