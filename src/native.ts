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
      '@lynx-lab/crypto: `NativeModules` недоступен. Этот код обязан выполняться ' +
        'на фоновом потоке (BTS): на главном потоке NativeModules не существует.'
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
      `@lynx-lab/crypto: нативный модуль "${MODULE_NAME}" не зарегистрирован.\n` +
        '  Android: смотри `adb logcat | grep "Skip unavailable Lynx library provider"`. ' +
        'Это сообщение означает, что процессор аннотаций kapt не отработал: ' +
        'библиотека обязана объявить id("org.jetbrains.kotlin.kapt") и ' +
        'kapt("org.lynxsdk.lynx:lynx-processor:4.0.1").\n' +
        '  iOS: проверь, что в Pods/ есть сгенерированный реестр autolink с ' +
        'упоминанием LynxCryptoModule. Если нет, маркер @LynxNativeModule("...") ' +
        'не сматчился.\n' +
        '  Ручной запасной путь для обеих платформ описан в README.'
    )
  }

  return candidate as LynxCryptoNative
}
