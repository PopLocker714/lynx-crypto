import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statfsSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const host = process.env.CONSUMER_ROOT
const tarball = process.env.CONSUMER_TARBALL
if (!host || !tarball) {
    throw new Error(
        'Set CONSUMER_ROOT and CONSUMER_TARBALL after installing that tarball in the Sparkling fixture; see CONTRIBUTING.md. This gate compiles, it does not claim device QA.'
    )
}
const temporary = mkdtempSync(join(tmpdir(), 'lynx-crypto-consumer-'))
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
function checkDisk() {
    for (const directory of [host, tmpdir()]) {
        const disk = statfsSync(directory)
        if (disk.bavail * disk.bsize < 25 * 1024 ** 3)
            throw new Error(`Native build needs at least 25 GiB free: ${directory}`)
    }
}
try {
    execFileSync('tar', ['-xzf', resolve(tarball), '-C', temporary])
    const files = execFileSync('tar', ['-tzf', resolve(tarball)], { encoding: 'utf8' })
        .trim()
        .split('\n')
    for (const file of files) {
        if (file.endsWith('/')) continue
        const relative = file.replace(/^package\//, '')
        const installed = join(host, 'node_modules/@lynx-lab/crypto', relative)
        if (!existsSync(installed) || hash(installed) !== hash(join(temporary, file))) {
            throw new Error(`Installed consumer package differs from tarball: ${relative}`)
        }
    }
    const run = (command, args, cwd = host) =>
        execFileSync(command, args, { cwd, stdio: 'inherit' })
    checkDisk()
    run('bun', ['run', 'build'])
    run('./android/gradlew', [
        '-p',
        'android',
        ':app:assembleDebug',
        ':app:assembleRelease',
        ':app:minifyReleaseWithR8',
        '--no-daemon',
    ])
    const mapping = join(host, 'android/app/build/outputs/mapping/release/mapping.txt')
    if (!existsSync(mapping))
        throw new Error('Missing Android Release R8 mapping; enable minifyEnabled in the fixture')
    checkDisk()
    for (const [configuration, scheme] of [
        ['Debug', process.env.IOS_DEBUG_SCHEME ?? 'SparklingGoInHouse'],
        ['Release', process.env.IOS_RELEASE_SCHEME ?? 'SparklingGo'],
    ]) {
        run(
            'xcodebuild',
            [
                '-workspace',
                'SparklingGo.xcworkspace',
                '-scheme',
                scheme,
                '-configuration',
                configuration,
                '-destination',
                'generic/platform=iOS',
                '-derivedDataPath',
                'build-crypto-consumer',
                'CODE_SIGNING_ALLOWED=NO',
                `IPHONEOS_DEPLOYMENT_TARGET=${process.env.IOS_DEPLOYMENT_TARGET ?? '15.6'}`,
                '-jobs',
                '4',
                'build',
            ],
            join(host, 'ios')
        )
    }
    mkdirSync('artifacts', { recursive: true })
    const evidence = {
        status: 'compile-only',
        deviceQA: 'not-run',
        tarball: resolve(tarball),
        sha256: hash(tarball),
        host: resolve(host),
        hostLockSha256: hash(join(host, 'bun.lock')),
        podLockSha256: hash(join(host, 'ios/Podfile.lock')),
        androidR8MappingSha256: hash(mapping),
        iosDeploymentTarget: process.env.IOS_DEPLOYMENT_TARGET ?? '15.6',
        configurations: ['Android Debug', 'Android Release R8', 'iOS Debug', 'iOS Release'],
        date: new Date().toISOString(),
    }
    writeFileSync('artifacts/consumer-build.json', `${JSON.stringify(evidence, null, 4)}\n`)
    console.log(
        'Consumer compile-only gate passed. Physical-device scenarios remain required; see docs/compatibility.md.'
    )
} finally {
    rmSync(temporary, { recursive: true, force: true })
}
