const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const LOOKUP = /* @__PURE__ */ (() => {
  const t = new Int16Array(128).fill(-1)
  for (let i = 0; i < ALPHABET.length; i++) t[ALPHABET.charCodeAt(i)] = i
  t['-'.charCodeAt(0)] = 62 // url-safe, терпим
  t['_'.charCodeAt(0)] = 63
  return t
})()

/**
 * Декодирует base64 прямо в `out` и возвращает число записанных байт.
 *
 * Написано руками намеренно: в Lynx 4.0.1 нет ни `atob`, ни `Buffer`, и
 * `@lynx-js/types@4.1.0` не объявляет ни того ни другого. Пробелы и переводы
 * строк пропускаются, поэтому Base64.NO_WRAP (Android) и
 * -base64EncodedStringWithOptions:0 (iOS) декодируются одинаково.
 */
export function decodeBase64Into(input: string, out: Uint8Array): number {
  let acc = 0
  let bits = 0
  let written = 0

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code === 61 /* '=' */) break
    const value = code < 128 ? (LOOKUP[code] ?? -1) : -1
    if (value < 0) continue

    acc = (acc << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      if (written >= out.length) return written
      out[written++] = (acc >>> bits) & 0xff
    }
  }
  return written
}

/** Нужен только тестовому фейку, но лежит рядом, чтобы пара не разъезжалась. */
export function encodeBase64(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    result += ALPHABET[b0 >> 2]
    result += ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)]
    result +=
      b1 === undefined ? '=' : ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)]
    result += b2 === undefined ? '=' : ALPHABET[b2 & 0x3f]
  }
  return result
}
