[English](./api.md) · [Русский](./api.ru.md)

# API and errors

`getRandomValues<T extends IntegerTypedArray>(array: T): T` accepts Int8/16/32Array,
Uint8/16/32Array, Uint8ClampedArray, BigInt64Array and BigUint64Array. It fills the
view's byte range and returns the same object. Zero bytes is a no-op. More than 65,536
bytes throws `QuotaExceededError`; non-integer views (including DataView and float
arrays from another realm) throw `TypeMismatchError`. Error names use DOMException
when available, otherwise an Error with the same name.

Native data must be a string containing exactly the requested number of decoded bytes.
Whitespace, URL-safe alphabet and omitted padding remain accepted. Invalid characters,
invalid padding, short data and extra bytes throw Error and zero the target view;
other bytes in the backing buffer are unchanged. Non-string responses throw TypeError
before mutation. A native exception propagates; no fallback random generator is used.

`randomUUID(): UUID` returns lowercase RFC 4122 version 4 with the RFC variant.
Malformed strings and non-string native results throw Error; objects are never coerced.
`UUID` retains the template-literal type `${string}-${string}-${string}-${string}-${string}`.

`install(): void` adds missing `getRandomValues`/`randomUUID` functions to
`globalThis.crypto`. Existing functions are preserved. Assignment failure throws Error
with the original cause. Importing the module does not mutate global state.

`setNativeModule(module: LynxCryptoNative | null): void` injects a native substitute;
`null` restores lookup. `LynxCryptoNative` exposes `randomBytesBase64(number): string`
and `randomUUID(): string`. Return values are still checked at runtime. Native lookup
requires BTS and both methods to be registered.

`createFakeCrypto(options?: FakeCryptoOptions): LynxCryptoNative` is available only from
`@lynx-lab/crypto/testing`. Options: `seed?: number`, `truncateTo?: number`, `fail?: boolean`,
`badUuid?: boolean`; each also accepts explicit undefined. The fake uses deterministic
xorshift32, can simulate short/failed reads and invalid UUIDs, and is never a CSPRNG.
