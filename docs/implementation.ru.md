[English](./implementation.md) · [Русский](./implementation.ru.md)

# Реализация

Структура остаётся небольшой: публичный TypeScript API → проверяемый native bridge →
Kotlin/Objective-C. Нет React-зависимости, фоновых заданий, listeners и удерживаемых
UI-объектов. Вызовы синхронны на BTS; один ограниченный CSPRNG-запрос (до 65 536 байт)
соответствует синхронному контракту WebCrypto. Android-модуль владеет одним потокобезопасным
SecureRandom. iOS использует локальный NSMutableData и ARC.

String/base64 — существующее представление bridge. Lynx копирует ArrayBuffer через
мост; native не может изменять TypedArray на месте. JS-обёртка заполняет исходный view.
Полная валидация ответа предшествует прежнему ограниченному decoder: лишние байты и
повреждённый ввод не превращаются в успешное полное чтение. Это проверка транспорта,
а не криптографический примитив.

На iOS отказ SecRandomCopyBytes возвращает пустую строку, которую JS отклоняет. На
Android отказ provider может бросить исключение; его доставка зависит от bridge host,
а JS также отклоняет отсутствующий или повреждённый ответ. Принудительный отказ native
provider на устройстве не проверен. Ошибки аргументов WebCrypto формируются в JS.

Имена Objective-C-методов не входят в ARC selector families с retained return (`new`,
`copy`, `init`, `alloc`, `mutableCopy`): Lynx вызывает их через reflection без передачи
владения. Маркер LynxNativeModule стоит непосредственно перед interface для CocoaPods
autolink. Fallback-маркер поддерживает заголовки Lynx 3.x без переписывания на Swift.

Исследованные аналоги (в этой миграции код не копировался):

- [react-native-get-random-values 1.11.0](https://github.com/LinusU/react-native-get-random-values/tree/94ece28d2d8516456d491a646dd896414c181c09): сохраняем небольшой wrapper над native CSPRNG, не переносим React Native bridge.
- [Expo crypto 15.0.9 / SDK 54](https://github.com/expo/expo/tree/12d6ea8d413e5bc80e8808cca52f47b146d44a90/packages/expo-crypto): сравниваем платформенные API энтропии, не переносим lifecycle Expo-модуля в Lynx.
