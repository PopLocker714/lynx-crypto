[English](./README.md) · [Русский](./README.ru.md)

# @lynx-lab/crypto

[![npm](https://img.shields.io/npm/v/@lynx-lab/crypto?color=cb3837&logo=npm)](https://www.npmjs.com/package/@lynx-lab/crypto)
[![CI](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@lynx-lab/crypto?color=blue)](./LICENSE)

Криптографически стойкие `getRandomValues` и `randomUUID` для Lynx: Android
`SecureRandom` и iOS `SecRandomCopyBytes` / `NSUUID`. Без permissions и entitlements.

## Поддержка платформ и возможностей

| Возможность | Android | iOS |
|---|---|---|
| Целочисленный TypedArray, заполнение на месте (до 65 536 байт) | Реализовано | Реализовано |
| UUID v4 в нижнем регистре | Реализовано | Реализовано |
| Опциональная установка `globalThis.crypto` | Фоновый поток | Фоновый поток |
| `crypto.subtle`, хеширование, шифрование | Не предоставляется | Не предоставляется |

Sparkling — первый host интеграции. Другим Lynx host нужны собственные проверки.
Кандидат стандарта v1 **ещё не принят как stable**: consumer Debug/Release,
Android R8 и проверки на физических устройствах должны относиться к его точному tarball.
Исторические результаты npm 1.0.3 не проверяют этот кандидат. См. [совместимость](./docs/compatibility.ru.md).

## Требования

Вызовы native выполняются на фоновом потоке Lynx (BTS).
Код уровня модуля ReactLynx выполняется и на главном потоке: не генерируйте байты там.
Опциональный peer `@lynx-js/types` — `^4.0.0`; это типы при компиляции, а не версия
установленного native runtime. Android объявляет min SDK 23 / compile SDK 35 / Java 11;
iOS — 12.0. Эти минимумы конфигурации не проверены на устройствах с минимальной ОС.

## Установка

```sh
bun add @lynx-lab/crypto
```

Android подключается через Lynx Autolink. На iOS выполните `pod install` в каталоге iOS
host-приложения. Записи в manifest, ключи Info.plist и разрешения не нужны. Ручная
регистрация описана в [интеграции и диагностике](./docs/integration.ru.md).

## Использование

```ts
import { getRandomValues, randomUUID } from '@lynx-lab/crypto'

// Вызывайте из BTS handler/effect, не на уровне модуля ReactLynx.
export function createSessionKey() {
    return { key: getRandomValues(new Uint8Array(32)), id: randomUUID() }
}
```

`getRandomValues` изменяет и возвращает тот же массив, включая view со смещением.
Для библиотек, ожидающих `globalThis.crypto`, вызовите `install()` один раз при старте BTS.
Существующие функции сохраняются; импорт пакета никогда не устанавливает глобалы.

## API

| Экспорт | Контракт |
|---|---|
| `getRandomValues(array)` | Только целочисленный TypedArray; возвращает тот же объект. `TypeMismatchError` для float/DataView; `QuotaExceededError` свыше 65 536 байт |
| `randomUUID()` | UUID v4 в нижнем регистре; отклоняет некорректный или нестроковый ответ native |
| `install()` | Ставит отсутствующие функции на `globalThis.crypto`; бросает при ошибке присваивания |
| `setNativeModule(module)` | Инъекция для тестов; `null` возвращает поиск native |
| `@lynx-lab/crypto/testing` | `createFakeCrypto(options)`; детерминированный и **небезопасный**, не для production |

Отсутствие native-регистрации/нужного потока, повреждённые, короткие и избыточные native-данные
вызывают ошибку. Пустые массивы возвращаются без изменения и без native-вызова. См. точный
[API и ошибки](./docs/api.ru.md), [реализацию](./docs/implementation.ru.md) и
[проверки для участников](./CONTRIBUTING.ru.md).

## Лицензия

[MIT](./LICENSE)
