# ProGuard Rules for Xiaozhi R1

# Keep Android classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.Application

# NanoHTTPD
-keep class fi.iki.elonen.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keep class com.xiaozhi.r1.manager.AppConfig { *; }
-keep class com.xiaozhi.r1.manager.Persona { *; }

# OkHttp
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ExoPlayer / Media3
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Picovoice (JNI heavily relies on these classes)
-keep class ai.picovoice.porcupine.** { *; }

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keep class kotlinx.coroutines.** { *; }
