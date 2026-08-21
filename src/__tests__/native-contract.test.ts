import { describe, expect, it } from 'vitest'
import { decodeBase64Into, encodeBase64 } from '../base64.js'
import { getNativeModule, setNativeModule } from '../native.js'

describe('base64', () => {
  it('кодирование и декодирование это обратные операции для всех длин 0..64', () => {
    for (let n = 0; n <= 64; n++) {
      const src = new Uint8Array(n)
      for (let i = 0; i < n; i++) src[i] = (i * 37 + 11) & 0xff
      const out = new Uint8Array(n)
      const written = decodeBase64Into(encodeBase64(src), out)
      expect(written).toBe(n)
      expect(Array.from(out)).toEqual(Array.from(src))
    }
  })

  it('терпит переводы строк и пробелы', () => {
    const src = new Uint8Array([1, 2, 3, 4, 5, 6])
    const wrapped = encodeBase64(src).replace(/(.{4})/g, '$1\n')
    const out = new Uint8Array(6)
    expect(decodeBase64Into(wrapped, out)).toBe(6)
    expect(Array.from(out)).toEqual(Array.from(src))
  })

  it('никогда не пишет за пределы out', () => {
    const src = new Uint8Array(32).fill(7)
    const out = new Uint8Array(8)
    expect(decodeBase64Into(encodeBase64(src), out)).toBe(8)
  })
})

describe('поиск нативного модуля', () => {
  it('без NativeModules сообщение называет BTS-поток', () => {
    setNativeModule(null)
    expect(() => getNativeModule()).toThrowError(/BTS/)
  })

  it('инъекция обходит поиск', () => {
    const fake = { randomBytesBase64: () => '', randomUUID: () => '' }
    setNativeModule(fake)
    expect(getNativeModule()).toBe(fake)
    setNativeModule(null)
  })
})
