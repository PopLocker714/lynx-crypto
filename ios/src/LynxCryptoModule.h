#import <Foundation/Foundation.h>
#import <Lynx/LynxModule.h>

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
