[English](./compatibility.md) · [Русский](./compatibility.ru.md)

# Совместимость и проверки

Намерение поддержки и проверенные профили разделены. Sparkling — первый host;
второго подтверждённого поддерживаемого профиля пока нет. Runtime, compile SDK,
TypeScript peers, ReactLynx и версия host — независимые оси. Peer не определяет runtime.

| Профиль | Артефакт | Runtime / устройства | Статус |
|---|---|---|---|
| Исторический опубликованный пакет | npm 1.0.3, gitHead `cb18cbe8e0c4b83497719809a37d098ddd80448b`, SHA256 `9958607e178d0866942e673051d9bdc79e5260951fb39473c4889ce2e69c5c76` | Sparkling / Lynx 3.9.0; Pixel 9 Android 17, iPhone 11 iOS 18.4.1 | Историческое device evidence; не проверяет этот diff |
| Кандидат стандарта v1 | Source commit и SHA256 из `check:package` / записи QA | Standalone Android: AGP 8.7.0, Gradle 8.9, Kotlin 2.0.21, JDK 17, compile SDK 35, min 23, Lynx compileOnly 4.0.1. Standalone iOS: реальный заголовок Lynx 3.9.0, локально Xcode 27.2, deployment target 12.0 | Candidate; consumer-приёмка ожидается |

Текущему host probe нужен iOS deployment override 15.6 для Pods с Xcode 27.2.
Это ограничение host/toolchain, не проверка работы на iOS 12 и не изменение podspec
библиотеки. Устройства с минимальными Android 23 / iOS 12 не проверены.
CI использует Xcode 16.4 на macos-15; локальные проверки Xcode 27.2 — отдельный профиль.
Успех локальных команд не означает, что GitHub CI уже был выполнен.

Для приёмки кандидата записываются source commit, SHA256 tarball, commit и lock hashes
host, ReactLynx/native runtime, ОС/устройство, compile/target/min SDK, JDK/Gradle/Kotlin/AGP,
Xcode/CocoaPods, конфигурации и результаты сценариев с датой. Устанавливается настоящий
tarball, затем проверяются autolink и Debug/Release на Android/iOS, включая Android
Release R8. `check:consumer` сверяет байты установленного пакета и собирает обе
платформы; успех явно означает compile-only, а не QA на физических устройствах.

Device-сценарии: целочисленные view и запись со смещением; возврат того же объекта;
ноль байт; граница 65 536 байт и quota failure; отказ для float/DataView; UUID v4 в
нижнем регистре; разные последовательные CSPRNG-выборки; обнаружение native-модуля;
вызов из BTS; опциональная установка глобалов. Проверяются результаты, не только
запуск приложения. JS-тесты с mock не доказывают принудительный отказ OS entropy provider.

При обновлении host сохраните verified-профиль, закрепите candidate fixture, установите
уже опубликованный tarball, проверьте затронутые контракты и затем старую и новую связки.
Обновляйте документацию по доказательствам. Новая версия host сама по себе не доказывает
совместимость. Снятие support минимума/host требует отдельного SemVer/deprecation-плана;
эта миграция не расширяет диапазон поддержки runtime.

Публикация заблокирована до workflow: подготовить version/changelog, один раз упаковать,
проверить этот immutable-артефакт в consumer и опубликовать тот же tarball.
См. [участие в разработке](../CONTRIBUTING.ru.md).
