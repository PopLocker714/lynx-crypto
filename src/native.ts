export interface LynxCryptoNative {
  /** base64 ровно из `byteLength` байт CSPRNG, либо '' при отказе. */
  randomBytesBase64(byteLength: number): string
  /** lowercase RFC 4122 v4. */
  randomUUID(): string
}

/**
 * Объявлено, но никогда не импортируется.
 *
 * `NativeModules` это `declare global` в @lynx-js/types: в тарболе пакета
 * нет ни одного .js, поэтому `import { NativeModules } from '@lynx-js/types'`
 * это падение в рантайме, а не ошибка типов, которую заметишь.
 */
declare const NativeModules: Record<string, unknown> | undefined

const MODULE_NAME = 'LynxCryptoModule'

let injected: LynxCryptoNative | null = null

/** Шов для тестов. `setNativeModule(null)` возвращает настоящий поиск. */
export function setNativeModule(module: LynxCryptoNative | null): void {
  injected = module
}

export function getNativeModule(): LynxCryptoNative {
  if (injected) return injected

  if (typeof NativeModules === 'undefined' || NativeModules === null) {
    throw new Error(
      '@lynx-lab/crypto: `NativeModules` is unavailable, so this call is running ' +
        'on the main thread.\n' +
        '  In ReactLynx, code at MODULE SCOPE runs on BOTH threads, so a call at ' +
        'the top level of a file fails exactly like this.\n' +
        '  Call it from inside a component, from an effect, or from anything that ' +
        'is background-thread (BTS) by construction.'
    )
  }

  const candidate = NativeModules[MODULE_NAME] as
    | Partial<LynxCryptoNative>
    | undefined

  if (
    !candidate ||
    typeof candidate.randomBytesBase64 !== 'function' ||
    typeof candidate.randomUUID !== 'function'
  ) {
    throw new Error(
      `@lynx-lab/crypto: native module "${MODULE_NAME}" is not registered.\n` +
        '  Android: check `adb logcat | grep "Skip unavailable Lynx library provider"`. ' +
        'That message means the kapt annotation processor did not run — the library ' +
        'must declare id("org.jetbrains.kotlin.kapt") and ' +
        'kapt("org.lynxsdk.lynx:lynx-processor").\n' +
        '  iOS: check that Pods/ contains a generated Lynx autolink registry naming ' +
        'LynxCryptoModule. If not, the @LynxNativeModule("...") marker was not matched.\n' +
        '  Manual fallback for both platforms: see the README.'
    )
  }

  return candidate as LynxCryptoNative
}
