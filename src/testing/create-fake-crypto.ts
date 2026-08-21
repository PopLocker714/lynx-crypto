import { encodeBase64 } from '../base64.js'
import type { LynxCryptoNative } from '../native.js'

export interface FakeCryptoOptions {
  /** Детерминированное зерно, чтобы тесты были воспроизводимы. */
  seed?: number
  /** Вернуть меньше байт, чем попросили: проверка пути короткого чтения. */
  truncateTo?: number
  /** Вернуть '' — имитация отказа нативного CSPRNG. */
  fail?: boolean
  /** Вернуть заведомо не-v4 UUID. */
  badUuid?: boolean
}

/**
 * Фейк нативного модуля для тестов и для разработки в Lynx Explorer,
 * где нативной половины ещё нет.
 *
 * НЕ КРИПТОГРАФИЧЕСКИ СТОЙКИЙ. Это xorshift32, он существует только чтобы
 * тесты были детерминированными. Никогда не использовать в проде.
 */
export function createFakeCrypto(
  options: FakeCryptoOptions = {}
): LynxCryptoNative {
  let state = (options.seed ?? 0x9e3779b9) >>> 0
  const next = (): number => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state & 0xff
  }

  return {
    randomBytesBase64(byteLength: number): string {
      if (options.fail) return ''
      const n = options.truncateTo ?? byteLength
      const bytes = new Uint8Array(n)
      for (let i = 0; i < n; i++) bytes[i] = next()
      return encodeBase64(bytes)
    },
    randomUUID(): string {
      if (options.badUuid) return 'NOT-A-UUID'
      const hex = '0123456789abcdef'
      let out = ''
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) out += '-'
        else if (i === 14) out += '4'
        else if (i === 19) out += hex[(next() & 0x03) | 0x08]
        else out += hex[next() & 0x0f]
      }
      return out
    },
  }
}
