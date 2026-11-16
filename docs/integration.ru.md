[English](./integration.md) · [Русский](./integration.ru.md)

# Интеграция и диагностика

Lynx может молча пропустить регистрацию модуля; ошибка пакета подсказывает обе причины.

**Android.** Проверьте `adb logcat | grep "Skip unavailable Lynx library provider"`.
Сообщение означает, что annotation processor не сработал. Gradle plugin Lynx передаёт
`-Alynx.library.packageName`, но не добавляет processor. Поэтому библиотека сама объявляет
`kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")`.

**iOS.** В `Pods/` должен быть сгенерированный реестр Autolink с `LynxCryptoModule`.
Если записи нет, маркер `@LynxNativeModule("...")` не совпал с регулярным выражением гема.
Требуется именно такое написание; между маркером и `@interface` допустим только whitespace.

Ручная регистрация, если Autolink не работает:

```kotlin
// Android, при старте приложения
LynxEnv.inst().registerModule("LynxCryptoModule", LynxCryptoModule::class.java)
```

```objc
// iOS
[config registerModule:LynxCryptoModule.class];
```
