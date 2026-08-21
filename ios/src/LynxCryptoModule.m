#import "LynxCryptoModule.h"
#import <Security/Security.h>

@implementation LynxCryptoModule

// `name` и `methodLookup` это классовые свойства протокола LynxModule.
// Строки подписи на iOS не существует вовсе: диспетчеризация это чистая
// рефлексия NSMethodSignature по этим селекторам.
+ (NSString *)name {
  return @"LynxCryptoModule";
}

+ (NSDictionary<NSString *, NSString *> *)methodLookup {
  return @{
    @"randomBytesBase64" : NSStringFromSelector(@selector(randomBytesBase64:)),
    @"randomUUID" : NSStringFromSelector(@selector(randomUUID)),
  };
}

// Lynx пробует оба инициализатора; в протоколе они @optional.
- (instancetype)init {
  return [super init];
}

- (instancetype)initWithParam:(id)param {
  return [self init];
}

/**
 * Параметр NSInteger, возврат NSString (_C_ID).
 *
 * Ни одно имя метода не использует ARC selector family (new/copy/init/
 * alloc/mutableCopy). PerformMethodInvocation делает
 * `[inv getReturnValue:&rawResult]` и затем `(__bridge id)` без передачи
 * владения, поэтому +1 возврат утёк бы или пере-освободился.
 */
- (NSString *)randomBytesBase64:(NSInteger)byteLength {
  if (byteLength <= 0 || byteLength > 65536) {
    return @"";
  }
  NSMutableData *data = [NSMutableData dataWithLength:(NSUInteger)byteLength];
  if (data == nil) {
    return @"";
  }
  int status = SecRandomCopyBytes(kSecRandomDefault,
                                  (size_t)byteLength,
                                  data.mutableBytes);
  if (status != errSecSuccess) {
    // Никогда не отдаём частично заполненный буфер. TS считает "" жёстким
    // отказом и бросает.
    return @"";
  }
  return [data base64EncodedStringWithOptions:0];
}

- (NSString *)randomUUID {
  // Foundation возвращает UPPERCASE, а спецификация требует lowercase.
  return [[[NSUUID UUID] UUIDString] lowercaseString];
}

@end
