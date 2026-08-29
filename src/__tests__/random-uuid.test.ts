import { afterEach, describe, expect, it } from 'vitest'
import { randomUUID, setNativeModule } from '../index.js'
import { createFakeCrypto } from '../testing/index.js'

afterEach(() => setNativeModule(null))

const V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('randomUUID', () => {
  it('соответствует форме v4 и lowercase', () => {
    setNativeModule(createFakeCrypto())
    const id = randomUUID()
    expect(id).toMatch(V4)
    expect(id).toBe(id.toLowerCase())
  })

  it('биты версии и варианта на месте', () => {
    setNativeModule(createFakeCrypto({ seed: 42 }))
    for (let i = 0; i < 50; i++) {
      const id = randomUUID()
      expect(id[14]).toBe('4')
      expect('89ab').toContain(id[19])
    }
  })

  it('не повторяется на подряд идущих вызовах', () => {
    setNativeModule(createFakeCrypto())
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) seen.add(randomUUID())
    expect(seen.size).toBe(100)
  })

  it('громко падает, если натив вернул не-v4', () => {
    setNativeModule(createFakeCrypto({ badUuid: true }))
    expect(() => randomUUID()).toThrowError(/non-v4/)
  })
})
