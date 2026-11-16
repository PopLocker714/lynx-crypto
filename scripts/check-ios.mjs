import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { checkObjcFormat } from './native-tools.mjs'

checkObjcFormat()
const header = process.env.LYNX_MODULE_HEADER
if (!header || !existsSync(header)) {
    throw new Error(
        'Set LYNX_MODULE_HEADER to the real LynxModule.h from the locked consumer SDK (see CONTRIBUTING.md)'
    )
}
const temporary = mkdtempSync(join(tmpdir(), 'lynx-crypto-clang-'))
try {
    mkdirSync(join(temporary, 'Lynx'))
    symlinkSync(resolve(header), join(temporary, 'Lynx/LynxModule.h'))
    mkdirSync('artifacts/ios', { recursive: true })
    const sdk = execFileSync('xcrun', ['--sdk', 'iphoneos', '--show-sdk-path'], {
        encoding: 'utf8',
    }).trim()
    const args = [
        '-x',
        'objective-c',
        '-fobjc-arc',
        '-fmodules',
        '-arch',
        'arm64',
        '-isysroot',
        sdk,
        '-miphoneos-version-min=12.0',
        '-isystem',
        temporary,
        '-Wall',
        '-Wextra',
        '-Werror',
        'ios/src/LynxCryptoModule.m',
    ]
    execFileSync('xcrun', ['clang', ...args, '-c', '-o', 'artifacts/ios/LynxCryptoModule.o'], {
        stdio: 'inherit',
    })
    execFileSync(
        'xcrun',
        [
            'clang',
            ...args,
            '--analyze',
            '-Xanalyzer',
            '-analyzer-werror',
            '-Xanalyzer',
            '-analyzer-output=plist',
            '-o',
            'artifacts/ios/analysis.plist',
        ],
        { stdio: 'inherit' }
    )
    console.log(`iOS standalone compile/static analysis passed; real header: ${resolve(header)}`)
} finally {
    rmSync(temporary, { recursive: true, force: true })
}
