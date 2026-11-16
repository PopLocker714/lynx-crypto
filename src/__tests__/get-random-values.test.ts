import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it } from 'vitest'
import { getRandomValues, setNativeModule } from '../index.js'
import { createFakeCrypto } from '../testing/index.js'

afterEach(() => setNativeModule(null))

describe('getRandomValues', () => {
    it('возвращает ТОТ ЖЕ объект, а не копию', () => {
        setNativeModule(createFakeCrypto())
        const a = new Uint8Array(16)
        expect(getRandomValues(a)).toBe(a)
    })

    it('заполняет весь массив', () => {
        setNativeModule(createFakeCrypto())
        const a = new Uint8Array(32)
        getRandomValues(a)
        expect(a.some((b) => b !== 0)).toBe(true)
    })

    it('уважает byteOffset у вида на больший буфер', () => {
        setNativeModule(createFakeCrypto())
        const buf = new ArrayBuffer(16)
        const view = new Uint8Array(buf, 4, 8)
        getRandomValues(view)
        const whole = new Uint8Array(buf)
        expect(whole.slice(0, 4).every((b) => b === 0)).toBe(true)
        expect(whole.slice(12).every((b) => b === 0)).toBe(true)
        expect(whole.slice(4, 12).some((b) => b !== 0)).toBe(true)
    })

    it('работает для всех целочисленных представлений', () => {
        setNativeModule(createFakeCrypto())
        for (const a of [
            new Int8Array(8),
            new Uint8ClampedArray(8),
            new Int16Array(8),
            new Uint16Array(8),
            new Int32Array(8),
            new Uint32Array(8),
        ]) {
            expect(getRandomValues(a as never)).toBe(a)
        }
    })

    it('пустой массив это no-op, без обращения к нативу', () => {
        setNativeModule(
            createFakeCrypto({ fail: true }) // упало бы, если бы позвали
        )
        const a = new Uint8Array(0)
        expect(getRandomValues(a)).toBe(a)
    })

    it('бросает QuotaExceededError свыше 65536 байт', () => {
        setNativeModule(createFakeCrypto())
        expect(() => getRandomValues(new Uint8Array(65537))).toThrowError(
            expect.objectContaining({ name: 'QuotaExceededError' })
        )
        expect(() => getRandomValues(new Uint8Array(65536))).not.toThrow()
    })

    it('бросает TypeMismatchError на массивы с плавающей точкой', () => {
        setNativeModule(createFakeCrypto())
        expect(() => getRandomValues(new Float32Array(4) as never)).toThrowError(
            expect.objectContaining({ name: 'TypeMismatchError' })
        )
        expect(() => getRandomValues(new Float64Array(4) as never)).toThrowError(
            expect.objectContaining({ name: 'TypeMismatchError' })
        )
    })

    it('бросает TypeMismatchError на DataView и не-вид', () => {
        setNativeModule(createFakeCrypto())
        expect(() => getRandomValues(new DataView(new ArrayBuffer(8)) as never)).toThrowError(
            expect.objectContaining({ name: 'TypeMismatchError' })
        )
        expect(() => getRandomValues([1, 2, 3] as never)).toThrowError(
            expect.objectContaining({ name: 'TypeMismatchError' })
        )
    })

    it('короткое чтение обнуляет буфер и громко падает', () => {
        setNativeModule(createFakeCrypto({ truncateTo: 4 }))
        const a = new Uint8Array(16)
        expect(() => getRandomValues(a)).toThrowError(/returned 4 of 16/)
        expect(a.every((b) => b === 0)).toBe(true)
    })

    it('отказ нативного CSPRNG это ошибка, а не тихий нуль', () => {
        setNativeModule(createFakeCrypto({ fail: true }))
        expect(() => getRandomValues(new Uint8Array(16))).toThrowError(/returned 0 of 16/)
    })
})

describe('bridge response validation', () => {
    it.each(['AQIDBA==', 'AQ!ID', 'AQID=garbage', 'AQID=', 'A', 'AQ==='])(
        'rejects invalid or oversized base64: %s',
        (encoded) => {
            setNativeModule({ randomBytesBase64: () => encoded, randomUUID: () => '' })
            const bytes = new Uint8Array(3).fill(42)
            expect(() => getRandomValues(bytes)).toThrow()
            expect(Array.from(bytes)).toEqual([0, 0, 0])
        }
    )

    it.each(['AQID', ' AQ\nID\t', '+/8=', '-_8=', '+/8'])(
        'preserves valid supported encodings: %s',
        (encoded) => {
            const expected = Buffer.from(encoded, 'base64')
            setNativeModule({ randomBytesBase64: () => encoded, randomUUID: () => '' })
            const bytes = new Uint8Array(expected.length)
            expect(getRandomValues(bytes)).toBe(bytes)
            expect(Array.from(bytes)).toEqual(Array.from(expected))
        }
    )

    it.each([null, undefined, 123, { toString: () => 'AQID' }])(
        'rejects non-string native responses',
        (encoded) => {
            // Deliberately violate the native signature to exercise the runtime boundary.
            setNativeModule({ randomBytesBase64: () => encoded as never, randomUUID: () => '' })
            expect(() => getRandomValues(new Uint8Array(3))).toThrow(TypeError)
        }
    )

    it('rejects foreign-realm float arrays and DataView, including a spoofed tag', () => {
        for (const expression of [
            'new Float32Array(4)',
            'new Float64Array(4)',
            'new DataView(new ArrayBuffer(8))',
        ]) {
            const value = runInNewContext(expression)
            Object.defineProperty(value, Symbol.toStringTag, { value: 'Uint8Array' })
            expect(() => getRandomValues(value)).toThrowError(
                expect.objectContaining({ name: 'TypeMismatchError' })
            )
        }
    })

    it('accepts foreign-realm integer arrays and BigInt arrays', () => {
        setNativeModule(createFakeCrypto())
        for (const expression of [
            'new Uint8Array(4)',
            'new BigInt64Array(2)',
            'new BigUint64Array(2)',
        ]) {
            const value = runInNewContext(expression)
            expect(getRandomValues(value)).toBe(value)
        }
    })

    it('native exceptions fail without returning success or mutating the view', () => {
        setNativeModule({
            randomBytesBase64: () => {
                throw new Error('provider failed')
            },
            randomUUID: () => '',
        })
        const bytes = new Uint8Array(3).fill(42)
        expect(() => getRandomValues(bytes)).toThrow('provider failed')
        expect(Array.from(bytes)).toEqual([42, 42, 42])
    })
})
