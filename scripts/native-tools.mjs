import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ktlintVersion = '1.7.1'
const ktlintHash = '5f3de4ee4014137b05c72ed68eb46fe686aeb11fbdef27faf77f55d51c1b2536'
const clangFormatVersion = '21.1.8'
const kotlinFiles = [
    'android/build.gradle.kts',
    'android-check/settings.gradle.kts',
    'android/src/main/java/dev/lynxlab/crypto/LynxCryptoModule.kt',
]
const objcFiles = ['ios/src/LynxCryptoModule.h', 'ios/src/LynxCryptoModule.m']

export function checkKotlinFormat(write = false) {
    const jar = resolve('.tools', `ktlint-${ktlintVersion}.jar`)
    if (!existsSync(jar)) {
        mkdirSync('.tools', { recursive: true })
        execFileSync(
            'curl',
            [
                '--fail',
                '--location',
                '--output',
                jar,
                `https://repo.maven.apache.org/maven2/com/pinterest/ktlint/ktlint-cli/${ktlintVersion}/ktlint-cli-${ktlintVersion}-all.jar`,
            ],
            { stdio: 'inherit' }
        )
    }
    if (createHash('sha256').update(readFileSync(jar)).digest('hex') !== ktlintHash) {
        throw new Error(`ktlint checksum mismatch: ${jar}`)
    }
    execFileSync('java', ['-jar', jar, ...(write ? ['--format'] : []), ...kotlinFiles], {
        stdio: 'inherit',
    })
}

export function checkObjcFormat(write = false) {
    const executable = process.env.CLANG_FORMAT ?? resolve('.tools/clang-format/bin/clang-format')
    const version = execFileSync(executable, ['--version'], { encoding: 'utf8' })
    if (!version.includes(`version ${clangFormatVersion}`)) {
        throw new Error(`Expected clang-format ${clangFormatVersion}; got ${version}`)
    }
    execFileSync(executable, [...(write ? ['-i'] : ['--dry-run', '--Werror']), ...objcFiles], {
        stdio: 'inherit',
    })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    if (process.argv[2] !== 'format') throw new Error('Usage: bun scripts/native-tools.mjs format')
    checkKotlinFormat(true)
    checkObjcFormat(true)
}
