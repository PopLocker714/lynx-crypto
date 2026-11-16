# @lynx-lab/crypto

Read CONTRIBUTING.md and docs/compatibility.md before changing code. Package standard
v1 baseline: Lynx Lab a8771a7. Keep public exports and valid-input behavior compatible.
Use the existing API → validated bridge → Kotlin/Objective-C structure.

- Install: `bun install --frozen-lockfile` (check disk first).
- Fast gate: `bun run check`.
- Format: `bun run format`, `bun run format:native`.
- Native: `bun run check:android`, `LYNX_MODULE_HEADER=/real/header bun run check:ios`.
- Consumer: `CONSUMER_ROOT=/fixture CONSUMER_TARBALL=/artifact bun run check:consumer`.
  This is compile-only; physical QA and evidence remain separate.
- Native tools/profile/exceptions: CONTRIBUTING.md.
- Update consumer documentation in English and Russian together.
- Do not publish: the release artifact lifecycle is intentionally blocked pending
  immutable artifact support. See CONTRIBUTING.md; no bypass variable.
