import { decodeBase64Into } from './base64.js'
import { domError } from './errors.js'
import { getNativeModule } from './native.js'

export type { LynxCryptoNative } from './native.js'
export { setNativeModule } from './native.js'

export type UUID = `${string}-${string}-${string}-${string}-${string}`

export type IntegerTypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array

const MAX_BYTES = 65536

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function isFloatView(value: ArrayBufferView): boolean {
  const g = globalThis as Record<string, unknown>
  const Float16 = g.Float16Array as (new () => unknown) | undefined
  return (
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    (typeof Float16 === 'function' && value instanceof (Float16 as never))
  )
}

/**
 * WebCrypto `crypto.getRandomValues`.
 *
 * Заполняет `array` на месте и возвращает ТОТ ЖЕ ОБЪЕКТ, а не копию. Это та
 * часть спецификации, которая важна каждой библиотеке снизу, и она сохранена,
 * хотя из натива мутировать JS-буфер невозможно: каждый ArrayBuffer,
 * пересекающий мост Lynx, копируется memcpy на границе JSI
 * (ValueUtils::ConvertPiperToArrayBuffer) и ещё раз на платформенном слое.
 * Поэтому запись на месте делает обёртка, а не нативный метод.
 */
export function getRandomValues<T extends IntegerTypedArray>(array: T): T {
  if (!ArrayBuffer.isView(array) || array instanceof DataView) {
    throw domError(
      'TypeMismatchError',
      '@lynx-lab/crypto: getRandomValues() expects an integer TypedArray'
    )
  }
  if (isFloatView(array)) {
    throw domError(
      'TypeMismatchError',
      '@lynx-lab/crypto: float typed arrays are not allowed'
    )
  }
  if (array.byteLength > MAX_BYTES) {
    throw domError(
      'QuotaExceededError',
      `@lynx-lab/crypto: byteLength ${array.byteLength} exceeds ${MAX_BYTES}`
    )
  }
  if (array.byteLength === 0) return array

  const encoded = getNativeModule().randomBytesBase64(array.byteLength)

  // byteOffset учитывается, поэтому вид на часть большего буфера работает.
  const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
  const written = decodeBase64Into(encoded, view)

  if (written !== array.byteLength) {
    // Никогда не отдаём наполовину случайный буфер. Короткое чтение означает,
    // что нативный CSPRNG отказал или мост обрезал. Оба случая должны быть громкими.
    view.fill(0)
    throw new Error(
      `@lynx-lab/crypto: native returned ${written} of ${array.byteLength} bytes`
    )
  }

  return array
}

/** WebCrypto `crypto.randomUUID`. Lowercase RFC 4122 v4. */
export function randomUUID(): UUID {
  const value = getNativeModule().randomUUID()
  if (!UUID_V4.test(value)) {
    throw new Error(
      `@lynx-lab/crypto: native randomUUID() returned a non-v4 value: ${value}`
    )
  }
  return value as UUID
}

/**
 * Опционально: выставить обе функции на `globalThis.crypto` для библиотек,
 * которые его вынюхивают (noble-curves, uuid, jose). Звать один раз, рано,
 * на фоновом потоке. Вопрос «имеет ли право библиотека ставить этот глобал
 * или это работа автора приложения» в Lynx открыт (глобалы ставятся в
 * lynx-core/index.card.ts), поэтому это opt-in, а не побочный эффект импорта.
 */
export function install(): void {
  const g = globalThis as Record<string, unknown>
  try {
    if (typeof g.crypto !== 'object' || g.crypto === null) g.crypto = {}
    const c = g.crypto as Record<string, unknown>
    if (typeof c.getRandomValues !== 'function')
      c.getRandomValues = getRandomValues
    if (typeof c.randomUUID !== 'function') c.randomUUID = randomUUID
  } catch (cause) {
    throw new Error(
      '@lynx-lab/crypto: could not install onto globalThis.crypto; import the ' +
        'named exports directly instead',
      { cause }
    )
  }
}
