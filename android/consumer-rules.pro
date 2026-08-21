# Методы модуля находятся рефлексией: LynxModuleWrapper.findMethods() зовёт
# Class.getDeclaredMethods() и оставляет всё с @LynxMethod. R8 в релизной
# сборке хоста об этом не знает.
-keep class dev.lynxlab.crypto.LynxCryptoModule { <init>(...); }
-keepclassmembers class dev.lynxlab.crypto.LynxCryptoModule {
    @com.lynx.jsbridge.LynxMethod <methods>;
}
# Autolink-провайдер инстанцируется через Class.forName(name).
-keep class dev.lynxlab.crypto.LynxLibraryProviderImpl { *; }
