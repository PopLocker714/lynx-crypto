# @lynx-lab/crypto

> **English** · [Русский](./README.ru.md)

[![npm](https://img.shields.io/npm/v/@lynx-lab/crypto?color=cb3837&logo=npm)](https://www.npmjs.com/package/@lynx-lab/crypto)
[![CI](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/PopLocker714/lynx-crypto/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@lynx-lab/crypto?color=blue)](./LICENSE)

`crypto.getRandomValues` and `crypto.randomUUID` for [Lynx](https://lynxjs.org).

Lynx 4.0.1 ships **no `crypto` global**. Searching `getRandomValues` and `crypto.subtle`
across `lynx-family/lynx` and `lynx-family/primjs` returns zero results, and the entire
PrimJS tree (660 paths) contains no file matching `random|crypto|entropy`. Without a
CSPRNG, noble-curves, tweetnacl, libsignal and anything doing PKCE or idempotency keys
refuse to run. `Math.random` on QuickJS does not count.

Backed by `java.security.SecureRandom` on Android and `SecRandomCopyBytes` on iOS.

## Install

```sh
bun add @lynx-lab/crypto
```

Then one step per platform, because Sparkling has no config-plugin system and a package
cannot write into someone else's build files.

**Android** — nothing. The library links through Autolink, requires no permissions, and
merges nothing into your manifest.

**iOS** — run `pod install` after installing the package.

No `Info.plist` keys, no entitlements, no permissions on either platform.

## Usage

```ts
import { getRandomValues, randomUUID } from '@lynx-lab/crypto'

const key = getRandomValues(new Uint8Array(32))
const id = randomUUID() // '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
```

The array is filled **in place** and the same object is returned, as the WebCrypto spec
requires. That matters to every library downstream of you.

If a library sniffs for `globalThis.crypto`, install it once at startup:

```ts
import { install } from '@lynx-lab/crypto'
install()
```

`install()` is opt-in rather than a side effect of importing: who owns the right to set
globals in Lynx is still an open question.

### Thread requirement

`NativeModules` in Lynx exists **only on the background (BTS) thread** and is `undefined`
on the main thread. Both functions must be called from the background thread.

**The trap:** in ReactLynx, code at **module scope runs on BOTH threads**. So this fails
every time, on the main-thread half:

```ts
// ❌ top level of a file — also runs on the main thread
const key = getRandomValues(new Uint8Array(32))
```

Call it from inside a component, from an effect, or from anything that is
background-thread by construction.

## API

| Function | What it does |
|---|---|
| `getRandomValues(array)` | Fills an integer TypedArray and returns **the same object**. Throws `QuotaExceededError` above 65536 bytes, and `TypeMismatchError` for float arrays and `DataView` |
| `randomUUID()` | Lowercase RFC 4122 v4 |
| `install()` | Puts both functions on `globalThis.crypto` without overwriting existing ones |
| `setNativeModule(m)` | Test seam. `null` restores real lookup |

The `@lynx-lab/crypto/testing` export provides `createFakeCrypto()` for tests and for
working in Lynx Explorer before the native half is linked. **It is not cryptographically
secure** and must never reach production.

## When the module is not found

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

## Implementation notes

**Why base64 rather than `byte[]`.** `byte[]` genuinely is a legal return type —
`LynxMethodWrapper.returnTypeToChar` maps it to `'a'` — and it arrives in JS as a real
`ArrayBuffer`. But `String` is `'T'` from `commonTypeToChar`, the branch shared by both
parameters and returns, and on iOS it rides `_C_ID` → `NSString`, the most heavily
exercised path in `PerformMethodInvocation`. At the 16–32 bytes per call that
`getRandomValues` actually gets asked for, the encoding is free. `byte[]` is a 1.1 patch,
once the pipeline is proven.

**Why the TypedArray never crosses into native.** It cannot:
`LynxJSIModule::invokeMethod` accepts an argument only if `o.isArrayBuffer()`, and a
`Uint8Array` fails that check. Even a true `ArrayBuffer` is memcpy'd at the JSI boundary
(`ValueUtils::ConvertPiperToArrayBuffer`) and again at the platform layer. In-place
mutation from native is structurally impossible, so the JS shim does the write — which is
how spec compliance survives: the same object comes back.

**Nothing is thrown from native.** `LynxModuleDarwin::InvokeMethod` wraps the whole
invocation in `@try/@catch`, logs, and delivers nothing to JS. Every spec error is raised
in TypeScript instead.

## License

MIT
