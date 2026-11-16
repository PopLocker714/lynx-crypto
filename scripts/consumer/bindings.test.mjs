import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, test } from 'vitest'

import {
    assertBindingFilesUnchanged,
    validateAndroidBinding,
    validateIOSBinding,
} from './bindings.mjs'

const temporary = []
afterEach(() => {
    for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true })
})

function fixture() {
    const host = realpathSync(mkdtempSync(join(tmpdir(), 'lynx-binding-test-')))
    temporary.push(host)
    const installed = join(host, 'node_modules/@lynx-lab/crypto')
    const write = (path, value = '') => {
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, value)
        return path
    }
    const sources = ['LynxCryptoModule.kt'].map((name) =>
        write(join(installed, 'android/src/main/java/dev/lynxlab/crypto', name), name)
    )
    const project = {
        path: ':lynx_library__lynx_lab_crypto',
        directory: join(installed, 'android'),
        sources: { Debug: sources, Release: sources },
    }
    const android = { projects: [project], variants: {} }
    for (const variant of ['Debug', 'Release']) {
        android.variants[variant] = {
            projects: [project.path],
            registry: [
                write(
                    join(
                        host,
                        'android/app/build/generated/source/lynxLibraryRegistry',
                        variant.toLowerCase(),
                        'com/lynx/tasm/library/LynxAutolinkGenerated.java'
                    ),
                    '"dev.lynxlab.crypto.LynxLibraryProviderImpl"; ' +
                        'LynxLibraryRegistry.setupGlobal(context, PROVIDERS); ' +
                        'LynxLibraryRegistry.setup(builder, PROVIDERS);'
                ),
            ],
        }
    }
    const ios = {
        podPath: join(installed, 'ios'),
        project: join(host, 'ios/Pods/LynxCrypto.xcodeproj'),
        sources: [
            write(join(installed, 'ios/src/LynxCryptoModule.m')),
            write(join(host, 'ios/Pods/Target Support Files/LynxCrypto/LynxCrypto-dummy.m')),
        ],
        headers: [
            write(join(installed, 'ios/src/LynxCryptoModule.h')),
            write(join(host, 'ios/Pods/Target Support Files/LynxCrypto/LynxCrypto-umbrella.h')),
        ],
        registry: [
            write(
                join(host, 'ios/generated/lynx-library/LynxGeneratedLibraryRegistry.m'),
                '[config registerModule:NSClassFromString(@"LynxCryptoModule") withName:@"LynxCryptoModule"];'
            ),
            write(
                join(
                    host,
                    'ios/Pods/Target Support Files/LynxLibraryRegistry/LynxLibraryRegistry-dummy.m'
                )
            ),
        ],
        linkedTargets: {},
        sourceConfigurations: [write(join(host, 'ios/Pods/Target Support Files/Source.xcconfig'))],
    }
    for (const path of [
        'ios/Pods/LynxCrypto.xcodeproj/project.pbxproj',
        'ios/Pods/Pods.xcodeproj/project.pbxproj',
        'ios/Pods/LynxLibraryRegistry.xcodeproj/project.pbxproj',
        'ios/SparklingGo.xcodeproj/project.pbxproj',
        'ios/Podfile.lock',
    ])
        write(join(host, path))
    return { host, installed, android, ios, write }
}

test('binds compiler inputs and records hashes; changed inputs fail after build', () => {
    const f = fixture()
    const evidence = {
        android: validateAndroidBinding(f.host, f.installed, f.android),
        ios: validateIOSBinding(f.host, f.installed, f.ios),
    }
    expect(() => assertBindingFilesUnchanged(evidence)).not.toThrow()
    f.write(f.android.variants.Release.registry[0], 'stale')
    expect(() => assertBindingFilesUnchanged(evidence)).toThrow('Build input changed')
})

test('rejects a stale GlobalStore Gradle directory despite matching node_modules', () => {
    const f = fixture()
    f.android.projects[0].directory = '/old-global-store/android'
    expect(() => validateAndroidBinding(f.host, f.installed, f.android)).toThrow('projectDir')
})

test('detects changes to inspected iOS source configurations after build', () => {
    const f = fixture()
    const evidence = { ios: validateIOSBinding(f.host, f.installed, f.ios) }
    f.write(f.ios.sourceConfigurations[0], 'EXCLUDED_SOURCE_FILE_NAMES = Module.m')
    expect(() => assertBindingFilesUnchanged(evidence)).toThrow('Build input changed')
})

test('rejects package project absent from Release runtime graph', () => {
    const f = fixture()
    f.android.variants.Release.projects = []
    expect(() => validateAndroidBinding(f.host, f.installed, f.android)).toThrow('does not link')
})

test('rejects stale Kotlin source even with a correct projectDir', () => {
    const f = fixture()
    f.android.projects[0].sources.Release = ['/old/LynxCryptoModule.kt']
    expect(() => validateAndroidBinding(f.host, f.installed, f.android)).toThrow('compiler sources')
})

test('rejects registry outside actual supported Java compiler input', () => {
    const f = fixture()
    f.android.variants.Debug.registry = ['/some/uncompiled/LynxAutolinkGenerated.java']
    expect(() => validateAndroidBinding(f.host, f.installed, f.android)).toThrow('compiler input')
})

test('rejects compiled registry without provider; a commented registration does not count', () => {
    const f = fixture()
    f.write(f.android.variants.Debug.registry[0], '// "dev.lynxlab.crypto.LynxLibraryProviderImpl"')
    expect(() => validateAndroidBinding(f.host, f.installed, f.android)).toThrow(
        'does not register'
    )
})

test('rejects stale Pod lock path and stale PBXSources independently', () => {
    const f = fixture()
    expect(() =>
        validateIOSBinding(f.host, f.installed, { ...f.ios, podPath: '/old/ios' })
    ).toThrow('Podfile.lock')
    f.ios.sources[0] = '/old/ios/src/LynxCryptoModule.m'
    expect(() => validateIOSBinding(f.host, f.installed, f.ios)).toThrow('source build phase')
})

test('rejects stale iOS registry source phase and missing module registration', () => {
    const f = fixture()
    expect(() =>
        validateIOSBinding(f.host, f.installed, { ...f.ios, registry: ['/old/registry.m'] })
    ).toThrow('Registry source build phase')
    f.write(
        f.ios.registry[0],
        '// [config registerModule:NSClassFromString(@"LynxCryptoModule") withName:@"LynxCryptoModule"];'
    )
    expect(() => validateIOSBinding(f.host, f.installed, f.ios)).toThrow('does not register')
})
