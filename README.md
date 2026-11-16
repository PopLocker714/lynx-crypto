[English](./README.md) · [Русский](./README.ru.md)

# @lynx-lab/crypto

[![npm](https://img.shields.io/npm/v/@lynx-lab/crypto?color=cb3837&logo=npm)](https://www.npmjs.com/package/@lynx-lab/crypto)
[![CI](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@lynx-lab/crypto?color=blue)](./LICENSE)

Cryptographically secure `getRandomValues` and `randomUUID` for Lynx, using Android
`SecureRandom` and iOS `SecRandomCopyBytes` / `NSUUID`. No permissions or entitlements.

## Platform and feature support

| Capability | Android | iOS |
|---|---|---|
| Integer TypedArray, in-place fill (up to 65,536 bytes) | Implemented | Implemented |
| Lowercase UUID v4 | Implemented | Implemented |
| Optional `globalThis.crypto` installation | Background thread | Background thread |
| `crypto.subtle`, hashing, encryption | Not provided | Not provided |

Sparkling is the first integration host. Other Lynx hosts require their own integration
checks. The standard-v1 runtime passed physical Android/iOS Debug/Release and Android R8
on the recorded Sparkling profile. It is **not yet accepted as stable**: minimum OS,
remote CI and the immutable-artifact release workflow remain open.
Exact artifacts and scenario limits are in [compatibility](./docs/compatibility.md).

## Requirements

Calls that need native code must run on the Lynx background thread (BTS).
ReactLynx module scope also executes on the main thread: do not generate bytes there.
The optional `@lynx-js/types` peer is `^4.0.0`; it is compile-time metadata, not the
installed native runtime version. Android declares min SDK 23 / compile SDK 35 / Java 11;
iOS declares 12.0. These configured minima have not been verified on minimum-OS devices.

## Install

```sh
bun add @lynx-lab/crypto
```

Android links through Lynx Autolink. On iOS run `pod install` in the host's iOS directory.
No manifest entries, Info.plist keys or permissions are required. See
[integration and troubleshooting](./docs/integration.md) for manual registration.

## Usage

```ts
import { getRandomValues, randomUUID } from '@lynx-lab/crypto'

// Call from a BTS event handler/effect; do not call at ReactLynx module scope.
export function createSessionKey() {
    return { key: getRandomValues(new Uint8Array(32)), id: randomUUID() }
}
```

`getRandomValues` mutates and returns the same array, including offset views.
For libraries that expect `globalThis.crypto`, call `install()` once from BTS startup.
It preserves existing functions and importing the package never installs globals.

## API

| Export | Contract |
|---|---|
| `getRandomValues(array)` | Integer TypedArray only; same object returned. `TypeMismatchError` for float arrays/DataView; `QuotaExceededError` above 65,536 bytes |
| `randomUUID()` | Lowercase UUID v4; rejects malformed or non-string native responses |
| `install()` | Installs missing functions on `globalThis.crypto`; throws when assignment fails |
| `setNativeModule(module)` | Test injection; `null` restores native lookup |
| `@lynx-lab/crypto/testing` | `createFakeCrypto(options)`; deterministic and **not secure**, never for production |

Missing native registration/thread context and malformed/short/oversized native data
throw. Empty arrays return unchanged without calling native. See the exact
[API and errors](./docs/api.md), [implementation](./docs/implementation.md) and
[contribution checks](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
