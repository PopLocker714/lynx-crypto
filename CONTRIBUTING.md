[English](./CONTRIBUTING.md) · [Русский](./CONTRIBUTING.ru.md)

# Contributing

This package adopts Lynx Lab package standard v1 from laboratory commit `a8771a7`.
Configuration changes are reviewed copies, not dependencies on a sibling checkout.
The existing public API → bridge → Kotlin/ObjC layout remains; no new architecture layer.

## Checks

Use Bun 1.4.0, TypeScript 5.9.3 and Biome 2.5.9 (pinned with bun.lock). The standard's
Biome 2.0 template was migrated with Biome 2.5.9; no tool downgrade. Own code uses four
spaces / 100 columns; YAML keeps two spaces. Node/DOM types exist only in the test
configuration; runtime source/declarations are checked against ES2022 without them.
`skipLibCheck` is false; explicit undefined remains allowed in published fake options.

```sh
bun install --frozen-lockfile
bun run check
bun run format
bun run format:native
```

`check` runs lint (warnings fail), runtime/test typechecks, Vitest, JS/declaration build
and an actual Bun tarball inspection. The inspector checks native sources, every export,
metadata, EN/RU docs and relative links, imports the packaged entrypoints, then saves
`artifacts/crypto-<sha256>.tgz`. Build uses `noEmitOnError`. Vitest is retained.

## Native checks

Before dependency installation keep at least 15 GiB free; before native builds at least
25 GiB, with 10 GiB remaining after expected peak usage. Serialize large builds.
Native tools stay local; no global package-manager changes are required.

```sh
python3 -m venv .tools/clang-format
.tools/clang-format/bin/pip install clang-format==21.1.8
# JAVA_HOME: JDK 17; ANDROID_HOME: an existing SDK with platform 35.
bun run check:android
# Use the real header from the locked host SDK, not a stub.
LYNX_MODULE_HEADER=/absolute/path/to/LynxModule.h bun run check:ios
```

ktlint 1.7.1 is fetched to `.tools` and verified by SHA256 before execution. The scripts
pin clang-format 21.1.8; CLANG_FORMAT may point to that exact version elsewhere.
Android uses the checked-in Gradle 8.9 wrapper, AGP 8.7.0 and Kotlin 2.0.21. Its standalone
strict profile selects language 1.9 for kapt (2.0 is unsupported there), and treats own
Kotlin/Lint warnings as errors without changing consumer compiler defaults. Checks
compile Debug/Release and run Android Lint. ObjC uses the real LynxModule header with
`-Wall -Wextra -Werror` and Clang static analysis. This is standalone compile/analysis,
not a linked consumer build. The optional init parameter is explicitly unused.

Known tooling diagnostic, owner Lynx Lab, review by 2026-12-16: AGP 8.7.0 SDK parser
reports “only understands SDK XML versions up to 3 but ... version 4 was encountered”
with the installed newer Android SDK metadata. Source: local standalone build on
2026-11-16. It is a tool metadata mismatch outside Kotlin/Android Lint; no diagnostic is
filtered and no SDK/host upgrade is included. Reassess when the standalone AGP profile
changes. Own compiler/Lint warnings still fail. No blanket pod `--allow-warnings` gate.

A second narrow exception is `GradleDependency` on the single
`androidx.annotation:annotation:1.9.1` declaration: Lint suggests 1.11.0. The existing
host-compatible dependency stays pinned; upgrading it requires separate consumer QA.
The inline suppression applies only to that declaration. Owner: Lynx Lab; source:
standalone Android Lint 2026-11-16; review by 2026-12-16 or a host profile upgrade.

## Consumer gate and physical QA

In an isolated Sparkling fixture, install the exact tarball with `bun add /path/package.tgz`,
run `bundle exec pod install` in `ios`, then:

```sh
CONSUMER_ROOT=/absolute/path/to/fixture \
CONSUMER_TARBALL=/absolute/path/to/package.tgz bun run check:consumer
```

The command compares every installed package file with the archive, builds the host JS,
Android Debug/Release with R8 mapping required, and unsigned iOS Debug/Release. Defaults:
workspace SparklingGo.xcworkspace, schemes SparklingGoInHouse/SparklingGo, deployment
15.6; override IOS_DEBUG_SCHEME, IOS_RELEASE_SCHEME, IOS_DEPLOYMENT_TARGET for a locked
profile. Dependencies/Pods must already be installed. It does not install or use a device.
Outputs stay in the fixture's Android build and `ios/build-crypto-consumer`; the receipt
is `artifacts/consumer-build.json`. Receipt status is compile-only. Run the physical
scenarios and record exact toolchain/device evidence from [compatibility](./docs/compatibility.md).

## Release status

Publication is deliberately blocked by `scripts/release-preflight.mjs` in the manual
Release workflow. Existing semantic-release configuration is retained; dry-run remains
available after same-commit reusable CI checks. This is a known unfinished release step,
not an immutable-artifact gate. Required follow-up: prepare version/changelog → immutable
tarball → consumer QA against that tarball → publish exactly that tarball. Do not remove
the blocker by supplying an environment bypass. Publication requires separate approval.

## Documentation

Update EN/RU pairs together. README stays concise; API, integration, implementation and
compatibility details live in `docs/` and ship in the tarball. Examples must typecheck.

## Commits decide the version

Versions are never set by hand. `semantic-release` reads the commit history and decides,
so a commit prefix is a version claim.

| Prefix | Bump | CHANGELOG section |
|---|---|---|
| `feat:` | minor | ✨ Features |
| `fix:` | patch | 🐛 Bug Fixes |
| `perf:` | patch | 💨 Performance Improvements |
| `refactor:` | patch | 🔄 Code Refactors |
| `docs:` | patch | 📚 Documentation |
| `chore:` | patch | 🛠️ Other changes |
| `BREAKING CHANGE:` in the body | major | its own section |

A commit with no recognised prefix triggers no release.
