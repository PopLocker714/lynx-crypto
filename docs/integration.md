[English](./integration.md) · [Русский](./integration.ru.md)

# Integration and troubleshooting

The Lynx pipeline fails silently, so this package's error names both causes up front.

**Android.** Check `adb logcat | grep "Skip unavailable Lynx library provider"`. That
message means the annotation processor did not run. Lynx's Gradle plugin passes
`-Alynx.library.packageName` but **does not add the processor itself**, so the library
declares `kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")` on its own.

**iOS.** Check that `Pods/` contains a generated Autolink registry mentioning
`LynxCryptoModule`. If it does not, the `@LynxNativeModule("...")` marker was not matched.
The gem's regex requires that exact spelling and allows only whitespace between the marker
and `@interface`.

**Manual fallback** if Autolink is not working:

```kotlin
// Android, at app startup
LynxEnv.inst().registerModule("LynxCryptoModule", LynxCryptoModule::class.java)
```

```objc
// iOS
[config registerModule:LynxCryptoModule.class];
```

