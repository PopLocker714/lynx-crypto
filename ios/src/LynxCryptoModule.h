#import <Foundation/Foundation.h>
#import <Lynx/LynxModule.h>


// Макрос LynxNativeModule появился только в Lynx 4.x. На 3.x его нет, и тогда
// `@LynxNativeModule("...")` это `@` плюс неизвестный идентификатор, то есть
// ошибка компиляции `unexpected '@' in program`, а следом ещё и
// `cannot use 'super' because it is a root class`, потому что @interface
// разбирается неверно.
//
// Объявляем сами ровно тем же, чем Lynx 4.x: раскрывается в
// `@class LynxNativeModuleMarker;` и нужен исключительно для того, чтобы
// регулярка гема cocoapods-lynx-library нашла маркер.
#ifndef LynxNativeModule
#define LynxNativeModule(module_name) class LynxNativeModuleMarker;
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-половина `@lynx-lab/crypto`.
 *
 * Маркер ниже это то, что сканирует cocoapods-lynx-library. Он раскрывается
 * в `@class LynxNativeModuleMarker;` и обязан стоять непосредственно перед
 * @interface, без комментария и пустой строки между ними: регулярка гема
 * допускает только пробельные символы. Написание @LynxNativeModuleRegister,
 * как в create-lynx-library, не матчится ничем.
 *
 * Обязательно Objective-C, не Swift: маркер это препроцессорный макрос под
 * `#if defined(__OBJC__)`, в Swift его существовать не может.
 *
 * Если хост не использует autolink, регистрация одной строкой на старте:
 *
 *     [config registerModule:LynxCryptoModule.class];
 */
@LynxNativeModule("LynxCryptoModule")
@interface LynxCryptoModule : NSObject <LynxModule>
@end

NS_ASSUME_NONNULL_END
