import { decodeBase64Into, decodedBase64Length } from './base64.js'
import { domError } from './errors.js'
import { getNativeModule } from './native.js'

export type { LynxCryptoNative } from './native.js'
export { setNativeModule } from './native.js'

/** Lowercase RFC 4122 v4 UUID returned by {@link randomUUID}. */
export type UUID = `${string}-${string}-${string}-${string}-${string}`

/** Integer views accepted by {@link getRandomValues}; byteLength is limited to 65,536. */
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

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// The intrinsic getter reads the internal TypedArray kind across realms and ignores
// an own Symbol.toStringTag property. DataView has no TypedArray kind.
const typedArrayKind = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(Uint8Array.prototype),
    Symbol.toStringTag
)?.get

const INTEGER_ARRAY_KINDS = new Set([
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'BigInt64Array',
    'BigUint64Array',
])

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
    const kind: unknown = ArrayBuffer.isView(array) ? typedArrayKind?.call(array) : undefined
    if (typeof kind !== 'string' || !INTEGER_ARRAY_KINDS.has(kind)) {
        throw domError(
            'TypeMismatchError',
            typeof kind === 'string' && kind.startsWith('Float')
                ? '@lynx-lab/crypto: float typed arrays are not allowed'
                : '@lynx-lab/crypto: getRandomValues() expects an integer TypedArray'
        )
    }
    if (array.byteLength > MAX_BYTES) {
        throw domError(
            'QuotaExceededError',
            `@lynx-lab/crypto: byteLength ${array.byteLength} exceeds ${MAX_BYTES}`
        )
    }
    if (array.byteLength === 0) return array

    const encoded: unknown = getNativeModule().randomBytesBase64(array.byteLength)

    // byteOffset учитывается, поэтому вид на часть большего буфера работает.
    const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
    if (typeof encoded !== 'string') {
        throw new TypeError('@lynx-lab/crypto: native randomBytesBase64() returned a non-string')
    }
    const written = decodedBase64Length(encoded)
    if (written === null) {
        view.fill(0)
        throw new Error('@lynx-lab/crypto: native returned malformed base64')
    }

    if (written !== array.byteLength) {
        // Никогда не отдаём наполовину случайный буфер. Короткое чтение означает,
        // что нативный CSPRNG отказал или мост обрезал. Оба случая должны быть громкими.
        view.fill(0)
        throw new Error(`@lynx-lab/crypto: native returned ${written} of ${array.byteLength} bytes`)
    }

    decodeBase64Into(encoded, view)
    return array
}

/** WebCrypto `crypto.randomUUID`. Lowercase RFC 4122 v4. */
export function randomUUID(): UUID {
    const value: unknown = getNativeModule().randomUUID()
    if (typeof value !== 'string' || !UUID_V4.test(value)) {
        throw new Error(
            `@lynx-lab/crypto: native randomUUID() returned a non-v4 value: ${typeof value === 'string' ? value : '<non-string>'}`
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
        if (typeof c.getRandomValues !== 'function') c.getRandomValues = getRandomValues
        if (typeof c.randomUUID !== 'function') c.randomUUID = randomUUID
    } catch (cause) {
        throw new Error(
            '@lynx-lab/crypto: could not install onto globalThis.crypto; import the ' +
                'named exports directly instead',
            { cause }
        )
    }
}
