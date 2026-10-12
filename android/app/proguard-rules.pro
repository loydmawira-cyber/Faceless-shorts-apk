# Add project specific ProGuard rules here.
-keep class com.facelessshorts.autopilot.data.models.** { *; }
-keepattributes *Annotation*,InnerClasses,Signature
-dontwarn org.apache.http.**
-dontwarn com.google.api.client.**
