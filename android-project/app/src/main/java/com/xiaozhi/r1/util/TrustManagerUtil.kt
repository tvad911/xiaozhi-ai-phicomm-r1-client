package com.xiaozhi.r1.util

import android.os.Build
import okhttp3.OkHttpClient
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

object TrustManagerUtil {
    fun getUnsafeTrustManager(): X509TrustManager {
        return object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        }
    }

    fun getUnsafeSslSocketFactory(trustManager: X509TrustManager): SSLSocketFactory {
        val sslContext = SSLContext.getInstance("TLSv1.2")
        sslContext.init(null, arrayOf<TrustManager>(trustManager), SecureRandom())
        return sslContext.socketFactory
    }

    fun applyUnsafeSslIfNecessary(builder: OkHttpClient.Builder) {
        if (Build.VERSION.SDK_INT <= 22) {
            val trustManager = getUnsafeTrustManager()
            val sslSocketFactory = getUnsafeSslSocketFactory(trustManager)
            builder.sslSocketFactory(sslSocketFactory, trustManager)
            builder.hostnameVerifier { _, _ -> true }
        }
    }
}
