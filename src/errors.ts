/**
 * WebCrypto предписывает здесь DOMException. Есть ли DOMException в BTS-рантайме
 * Lynx (PrimJS), НЕ ПОДТВЕРЖДЕНО: биндинга не нашлось и в @lynx-js/types@4.1.0
 * его нет. Поэтому используем, когда есть, и падаем в Error с правильным `.name`,
 * когда нет. Библиотека, делающая `instanceof DOMException`, на запасном пути
 * не совпадёт.
 */
export function domError(name: string, message: string): Error {
  const Ctor = (globalThis as Record<string, unknown>).DOMException
  if (typeof Ctor === 'function') {
    try {
      return new (Ctor as new (m: string, n: string) => Error)(message, name)
    } catch {
      /* падаем ниже */
    }
  }
  const error = new Error(message)
  error.name = name
  return error
}
