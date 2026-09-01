# Capacitor WebView — keep JS interfaces and bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.getcapacitor.** { *; }
-keep class ticklelist.org.** { *; }

# Preserve WebView and WebSettings
-keep class android.webkit.** { *; }
-keep class android.webkit.WebView { *; }

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
