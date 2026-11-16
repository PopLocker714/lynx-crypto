import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// Only these two release-tool advisories are accepted for this audited dependency
// graph. Owner: Lynx Lab; reassess by 2026-12-16 and before enabling publication.
if (new Date() >= new Date('2026-12-17T00:00:00Z')) {
    throw new Error(
        'Audit exceptions expired; reassess GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249'
    )
}
const auditedLock = 'bcadd6e3d33b25601c57d3a29a4730fe5c0669c578e81129b3d59c1e824ff967'
if (createHash('sha256').update(readFileSync('bun.lock')).digest('hex') !== auditedLock) {
    throw new Error(
        'Dependency graph changed: reassess the two audit exceptions before updating the approved lock hash'
    )
}
// Bun audits the lock graph, but npm also ships physically bundled dependencies.
// npm 11.21.2 was inspected separately; the old 11.19.0 bundle retained vulnerable
// code even after Bun updated the corresponding lock entries.
const release = createRequire(import.meta.resolve('semantic-release'))
const plugin = createRequire(release.resolve('@semantic-release/npm'))
const bundledNpm = plugin('npm/package.json')
if (bundledNpm.version !== '11.21.2')
    throw new Error('Reassess the actual bundled npm dependencies')
const result = spawnSync(
    'bun',
    ['audit', '--ignore', 'GHSA-3g3m-2fjr-6pw4', '--ignore', 'GHSA-g3hv-75wg-m249'],
    { stdio: 'inherit' }
)
if (result.error) throw result.error
process.exitCode = result.status ?? 1
