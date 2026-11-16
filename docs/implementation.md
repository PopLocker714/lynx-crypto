[English](./implementation.md) · [Русский](./implementation.ru.md)

# Implementation

The existing layout stays small: public TypeScript API → validated native bridge →
Kotlin/Objective-C implementation. There is no React dependency and no background job,
listener or retained UI object. Calls are synchronous on BTS; a single bounded CSPRNG
request (at most 65,536 bytes) fits the synchronous WebCrypto contract. The Android
module owns one thread-safe SecureRandom instance. iOS uses local NSMutableData and ARC.

String/base64 is the established bridge representation. Lynx copies ArrayBuffers across
the bridge; a TypedArray cannot be mutated in place by native code. The JS wrapper fills
the original view. Full-response validation precedes the existing bounded decoder, so
extra bytes or corrupt input cannot masquerade as a complete native read. This is
transport validation, not a cryptographic primitive.

On iOS SecRandomCopyBytes failure returns an empty string, which JS rejects. Android
provider failure may throw; native exception delivery depends on the host bridge, and
JS also rejects missing or malformed results. Forced native provider failure has not
been verified on a device. All specified WebCrypto argument errors originate in JS.

The Objective-C method names avoid ARC retained-return selector families (`new`, `copy`,
`init`, `alloc`, `mutableCopy`); Lynx invokes them reflectively without ownership transfer.
The LynxNativeModule marker immediately precedes the interface for CocoaPods autolink.
The fallback marker permits Lynx 3.x headers without rewriting the module in Swift.

Research references (reviewed for the pilot; no code copied in this migration):

- [react-native-get-random-values 1.11.0](https://github.com/LinusU/react-native-get-random-values/tree/94ece28d2d8516456d491a646dd896414c181c09): retain the small native-CSPRNG wrapper approach, not its React Native bridge.
- [Expo crypto 15.0.9 / SDK 54](https://github.com/expo/expo/tree/12d6ea8d413e5bc80e8808cca52f47b146d44a90/packages/expo-crypto): compare platform entropy APIs; do not copy Expo module lifecycle into Lynx.
