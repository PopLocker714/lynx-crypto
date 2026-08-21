package dev.lynxlab.crypto

import android.content.Context
import android.util.Base64
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.jsbridge.LynxNativeModule
import java.security.SecureRandom
import java.util.UUID

/** Потолок WebCrypto на один вызов getRandomValues(). */
private const val MAX_BYTES = 65536

/**
 * Android-половина `@lynx-lab/crypto`.
 *
 * Ни один метод не бросает. Все ошибки спецификации (QuotaExceededError,
 * TypeMismatchError) поднимаются в TypeScript, потому что судьба броска
 * через мост Lynx не подтверждена ни на одной платформе, а WebCrypto и так
 * относит эти ошибки к JS-слою. Контракт натива один: вернуть ровно
 * byteLength байт CSPRNG в base64 либо пустую строку. TS считает короткое
 * чтение жёстким отказом.
 *
 * Если сборка хоста не запускает процессор аннотаций, регистрировать вручную:
 *
 *     LynxEnv.inst().registerModule("LynxCryptoModule", LynxCryptoModule::class.java)
 */
@LynxNativeModule(name = "LynxCryptoModule")
class LynxCryptoModule(context: Context) : LynxModule(context) {

  // SecureRandom потокобезопасен и самозасевается. Держим на экземпляр
  // модуля, а не на вызов: дорогая часть это конструирование.
  private val rng = SecureRandom()

  /**
   * Возврат 'T' (String), параметр 'i' (int). Оба из
   * LynxMethodWrapper.commonTypeToChar, проверено на теге 4.0.1.
   */
  @LynxMethod
  fun randomBytesBase64(byteLength: Int): String {
    if (byteLength <= 0 || byteLength > MAX_BYTES) return ""
    val out = ByteArray(byteLength)
    rng.nextBytes(out)
    return Base64.encodeToString(out, Base64.NO_WRAP)
  }

  /** Возврат 'T'. java.util.UUID.toString() уже lowercase v4. */
  @LynxMethod
  fun randomUUID(): String = UUID.randomUUID().toString()
}
