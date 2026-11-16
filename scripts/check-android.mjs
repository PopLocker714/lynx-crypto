import { execFileSync } from 'node:child_process'
import { checkKotlinFormat } from './native-tools.mjs'

checkKotlinFormat()
execFileSync(
    './android-check/gradlew',
    [
        '-PlynxCryptoStrictChecks=true',
        '-p',
        'android-check',
        ':lynx-crypto:assembleDebug',
        ':lynx-crypto:assembleRelease',
        ':lynx-crypto:lintDebug',
        ':lynx-crypto:lintRelease',
        '--no-daemon',
        '--stacktrace',
    ],
    { stdio: 'inherit' }
)
