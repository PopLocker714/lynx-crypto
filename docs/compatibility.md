[English](./compatibility.md) · [Русский](./compatibility.ru.md)

# Compatibility and verification

Support intent and tested profiles are separate. Sparkling is the initial host; there
is no verified second supported profile yet. Runtime, compile SDK, TypeScript peers,
ReactLynx and host versions are independent axes. Do not infer a runtime from a peer.

| Profile | Artifact | Runtime / devices | Status |
|---|---|---|---|
| Historical published package | npm 1.0.3, gitHead `cb18cbe8e0c4b83497719809a37d098ddd80448b`, SHA256 `9958607e178d0866942e673051d9bdc79e5260951fb39473c4889ce2e69c5c76` | Sparkling / Lynx 3.9.0; Pixel 9 Android 17, iPhone 11 iOS 18.4.1 | Historical device evidence; does not verify this diff |
| Standard v1 candidate | Source commit and SHA256 printed by `check:package` / recorded with QA | Standalone Android: AGP 8.7.0, Gradle 8.9, Kotlin 2.0.21, JDK 17, compile SDK 35, min 23, Lynx compileOnly 4.0.1. Standalone iOS: real Lynx 3.9.0 header, Xcode 27.2 locally, deployment target 12.0 | Runtime accepted on recorded device profiles below; release blocked |

The current host probe's iOS Pods require a 15.6 deployment override with Xcode 27.2.
That is a host/toolchain restriction, not evidence of iOS 12 runtime support or a
change to this library's podspec. Minimum Android 23 / iOS 12 hardware is unverified.
CI uses Xcode 16.4 on macos-15; local Xcode 27.2 checks are a separate profile. CI workflow
execution is not implied by successful local commands.

Before accepting a candidate, record source commit, tarball SHA256, host commit and
lock hashes, ReactLynx/native runtimes, OS/device, compile/target/min SDK, JDK/Gradle/
Kotlin/AGP, Xcode/CocoaPods, configurations and dated scenario results. Install the
actual tarball, then test autolink and Debug/Release on Android and iOS, including
Android Release R8. `check:consumer` verifies installed package bytes and builds both
platforms; its success is explicitly compile-only, not physical-device QA.

Device scenarios: integer views and offset writes; same-object return; zero bytes;
65,536-byte boundary and quota failure; floating views/DataView rejection; lowercase
UUID v4; consecutive distinct CSPRNG samples; native module discovery; BTS calling
context; opt-in installation. Inspect results, not merely a successful app launch.
Mocked JS failure-path tests do not demonstrate a forced OS entropy-provider failure.

When a host changes, retain the verified profile, lock a candidate fixture, install
an already published tarball, check the affected contracts, then verify both old and
new profiles. Update documentation only from evidence. A new host version alone does
not establish compatibility. Removing a supported minimum/host requires explicit
SemVer/deprecation planning; no runtime support range is widened by this migration.

Publishing remains blocked until the workflow can prepare version/changelog, pack
once, run consumer QA against that immutable artifact, and publish that same tarball.
See [contributing](../CONTRIBUTING.md).

## Recorded consumer acceptance (2026-11-17)

Source `9d1bd34`, tarball SHA256 `11be0db8735d435a58a4f1f4443b566d7ec4c5e0076519e063e78cee669adf2f`, passed Pixel 9 / Android 17 and iPhone 11 / iOS 18.4.1 Debug/Release, Android R8, on Sparkling 2.1.0-rc.36 / Lynx 3.9.0 / ReactLynx 0.116.5. Native, failure injection and restored-native scenarios passed. Distinct samples are smoke, not an entropy proof.

Source `6805c374`, archive `c73335d3eb9ec10c4c25cd3513966da46995de733047ec6c0720e5bb4fa1a290`, adds source-binding tooling; only CONTRIBUTING EN/RU and package.json differ, 49 files are identical. Its actual native bindings and Release native smoke passed on both devices in ReactLynx 0.125.0 / types 4.2.1 / Rsbuild 2.1.10, preserving the native host. Evidence: probe source `616c66a`, evidence `51ae596`, `docs/evidence/lifecycle-2026-11-17/results.json`; full original scenarios: Lynx Lab `72d8262`, `docs/evidence/crypto-2026-11-16/results.json`.

This follow-up changes documentation only. The tested archive hashes identify the exact earlier artifacts; they must not be relabelled as the hash of a newly packed archive. Minimum OS, remote CI and release readiness remain unverified.
