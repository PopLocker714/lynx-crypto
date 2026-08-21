# @lynx-lab/crypto

> [English](./README.md) · **Русский**

[![npm](https://img.shields.io/npm/v/@lynx-lab/crypto?color=cb3837&logo=npm)](https://www.npmjs.com/package/@lynx-lab/crypto)
[![CI](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@lynx-lab/crypto?color=blue)](./LICENSE)

`crypto.getRandomValues` и `crypto.randomUUID` для [Lynx](https://lynxjs.org).

В Lynx 4.0.1 **нет глобала `crypto`**: поиск по `getRandomValues` и `crypto.subtle`
в `lynx-family/lynx` и `lynx-family/primjs` даёт ноль результатов, а всё дерево
PrimJS (660 путей) не содержит ни одного файла по `random|crypto|entropy`.
Без CSPRNG отказываются работать noble-curves, tweetnacl, libsignal и всё,
что делает PKCE или ключи идемпотентности. `Math.random` на QuickJS не считается.

Под капотом `java.security.SecureRandom` на Android и `SecRandomCopyBytes` на iOS.

## Установка

```sh
bun add @lynx-lab/crypto
```

Дальше по одному шагу на платформу, потому что у Sparkling нет системы
config-плагинов и пакет не может дописать чужие файлы сборки.

**Android** — ничего. Библиотека линкуется через Autolink, разрешений не требует,
в манифест ничего не мержит.

**iOS** — `pod install` после установки пакета.

Ни `Info.plist`, ни entitlements, ни разрешений не нужно ни на одной платформе.

## Использование

```ts
import { getRandomValues, randomUUID } from '@lynx-lab/crypto'

const key = getRandomValues(new Uint8Array(32))
const id = randomUUID() // '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
```

Массив заполняется **на месте**, и возвращается тот же самый объект, как требует
спецификация WebCrypto. Это важно для библиотек снизу по стеку.

Если библиотека вынюхивает `globalThis.crypto`, поставь его один раз на старте:

```ts
import { install } from '@lynx-lab/crypto'
install()
```

`install()` это opt-in, а не побочный эффект импорта: вопрос, кому в Lynx
принадлежит право ставить глобалы, пока открыт.

### Важно про поток

`NativeModules` в Lynx существует **только на фоновом потоке (BTS)** и на главном
потоке равен `undefined`. Обе функции обязаны вызываться с фонового потока.

## API

| Функция | Что делает |
|---|---|
| `getRandomValues(array)` | Заполняет целочисленный TypedArray, возвращает **тот же объект**. Бросает `QuotaExceededError` свыше 65536 байт и `TypeMismatchError` на массивы с плавающей точкой и на `DataView` |
| `randomUUID()` | Lowercase RFC 4122 v4 |
| `install()` | Ставит обе функции на `globalThis.crypto`, не затирая существующие |
| `setNativeModule(m)` | Шов для тестов. `null` возвращает настоящий поиск |

Экспорт `@lynx-lab/crypto/testing` даёт `createFakeCrypto()` для тестов
и для работы в Lynx Explorer, где нативной половины ещё нет.
**Он не криптостойкий** и в проде использоваться не должен.

## Если модуль не нашёлся

Пайплайн Lynx падает молча, поэтому ошибка пакета сразу называет обе причины.

**Android.** Смотри `adb logcat | grep "Skip unavailable Lynx library provider"`.
Это сообщение означает, что процессор аннотаций не отработал. Gradle-плагин Lynx
прокидывает `-Alynx.library.packageName`, но **сам процессор не добавляет**,
поэтому библиотека объявляет `kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")` сама.

**iOS.** Проверь, что в `Pods/` есть сгенерированный реестр autolink с упоминанием
`LynxCryptoModule`. Если нет, маркер `@LynxNativeModule("...")` не сматчился.
Регулярка гема требует ровно это написание и допускает между маркером
и `@interface` только пробельные символы.

**Ручной запасной путь**, если autolink не работает:

```kotlin
// Android, при старте приложения
LynxEnv.inst().registerModule("LynxCryptoModule", LynxCryptoModule::class.java)
```

```objc
// iOS
[config registerModule:LynxCryptoModule.class];
```

## Заметки о реализации

**Почему base64, а не `byte[]`.** `byte[]` действительно легальный тип возврата
(`LynxMethodWrapper.returnTypeToChar` даёт `'a'`) и прилетает в JS настоящим
`ArrayBuffer`. Но `String` это `'T'` из `commonTypeToChar`, ветки, общей для
параметров и возвратов, а на iOS он едет по `_C_ID` → `NSString`, самому
исхоженному пути в `PerformMethodInvocation`. При 16–32 байтах на вызов накладные
расходы вызова полностью перекрывают кодирование. `byte[]` это патч на 1.1,
когда конвейер уже доказан.

**Почему TypedArray не передаётся в натив.** Он не проходит вообще:
`LynxJSIModule::invokeMethod` принимает аргумент только если `o.isArrayBuffer()`,
а `Uint8Array` этой проверки не проходит. И даже настоящий `ArrayBuffer`
копируется memcpy на границе JSI, а затем ещё раз на платформенном слое.
Мутация на месте невозможна в принципе, поэтому заполняет массив JS-обёртка.
Спецификация при этом соблюдена: возвращается тот же объект.

**Никаких бросков из натива.** `LynxModuleDarwin::InvokeMethod` оборачивает вызов
в `@try/@catch`, пишет в лог и до JS не доводит ничего. Все ошибки спецификации
поднимаются в TypeScript.

## Лицензия

MIT
