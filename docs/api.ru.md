[English](./api.md) · [Русский](./api.ru.md)

# API и ошибки

`getRandomValues<T extends IntegerTypedArray>(array: T): T` принимает Int8/16/32Array,
Uint8/16/32Array, Uint8ClampedArray, BigInt64Array и BigUint64Array. Заполняет диапазон
байтов view и возвращает тот же объект. Нулевая длина — no-op. Свыше 65 536 байт —
`QuotaExceededError`; нецелочисленные view (включая DataView и float-массивы из другого
realm) — `TypeMismatchError`. Используется DOMException, когда доступен, иначе Error
с тем же именем.

Native-данные должны быть строкой с ровно запрошенным числом декодированных байтов.
Whitespace, URL-safe алфавит и отсутствие padding остаются допустимыми. Недопустимые
символы, padding, короткие и избыточные данные вызывают Error и обнуляют целевой view;
остальные байты исходного буфера не меняются. Нестроковые ответы вызывают TypeError
до изменения массива. Native exception распространяется; запасного генератора нет.

`randomUUID(): UUID` возвращает RFC 4122 version 4 с RFC variant в нижнем регистре.
Некорректные строки и нестроковые native-ответы вызывают Error; объекты не приводятся
к строке. `UUID` сохраняет template-literal тип `${string}-${string}-${string}-${string}-${string}`.

`install(): void` добавляет отсутствующие функции `getRandomValues`/`randomUUID` в
`globalThis.crypto`. Существующие функции сохраняются. Ошибка присваивания вызывает
Error с исходной причиной. Импорт модуля не меняет глобальное состояние.

`setNativeModule(module: LynxCryptoNative | null): void` подставляет native-замену;
`null` возвращает поиск. `LynxCryptoNative` содержит `randomBytesBase64(number): string`
и `randomUUID(): string`. Результаты проверяются и в runtime. Для поиска native нужны
BTS и регистрация обоих методов.

`createFakeCrypto(options?: FakeCryptoOptions): LynxCryptoNative` доступен только через
`@lynx-lab/crypto/testing`. Опции: `seed?: number`, `truncateTo?: number`, `fail?: boolean`,
`badUuid?: boolean`; каждая допускает явный undefined. Fake использует детерминированный
xorshift32, имитирует короткие/неудачные чтения и неверные UUID и никогда не является CSPRNG.
