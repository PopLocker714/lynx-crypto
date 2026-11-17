[English](./CONTRIBUTING.md) · [Русский](./CONTRIBUTING.ru.md)

# Участие в разработке

Пакет внедряет стандарт пакетов Lynx Lab v1 из commit лаборатории `a8771a7`.
Конфиги копируются через review, без зависимости от соседнего checkout. Сохранена
структура public API → bridge → Kotlin/ObjC, без нового архитектурного слоя.

## Проверки

Bun 1.4.0, TypeScript 5.9.3 и Biome 2.5.9 закреплены вместе с bun.lock. Шаблон стандарта
Biome 2.0 мигрирован через Biome 2.5.9 без downgrade. Свой код: четыре пробела / 100
символов, YAML — два пробела. Node/DOM-типы есть только в test-конфигурации; runtime
исходники/declarations проверяются против ES2022 без них. `skipLibCheck` выключен;
опции публичного fake по-прежнему допускают явный undefined.

```sh
bun install --frozen-lockfile
bun run check
bun run format
bun run format:native
```

`check` запускает lint (warnings означают failure), runtime/test typechecks, Vitest,
JS/declaration build и проверку настоящего Bun tarball. Проверяются native source,
все exports, metadata, EN/RU docs и относительные ссылки; импортируются упакованные
entrypoints. Результат: `artifacts/crypto-<sha256>.tgz`. В build включён `noEmitOnError`.
Vitest сохранён.

## Native-проверки

Перед установкой зависимостей нужно минимум 15 ГиБ свободно, перед native build —
25 ГиБ; после ожидаемого пика должно остаться 10 ГиБ. Тяжёлые сборки выполняются
последовательно. Native tools устанавливаются локально, без глобальных обновлений.

```sh
python3 -m venv .tools/clang-format
.tools/clang-format/bin/pip install clang-format==21.1.8
# JAVA_HOME: JDK 17; ANDROID_HOME: существующий SDK с platform 35.
bun run check:android
# Настоящий заголовок из закреплённого host SDK, не заглушка.
LYNX_MODULE_HEADER=/absolute/path/to/LynxModule.h bun run check:ios
```

ktlint 1.7.1 загружается в `.tools` и проверяется по SHA256 до запуска. Скрипты требуют
clang-format 21.1.8; CLANG_FORMAT может указывать на ту же версию в другом месте.
Android использует Gradle wrapper 8.9, AGP 8.7.0, Kotlin 2.0.21. Строгий standalone
профиль выбирает language 1.9 для kapt (2.0 там не поддерживается) и превращает свои
Kotlin/Lint warnings в errors, не меняя compiler defaults потребителя. Компилируются
Debug/Release, запускается Android Lint. ObjC использует настоящий LynxModule header,
`-Wall -Wextra -Werror` и Clang static analysis. Это standalone compile/analysis,
не linked consumer build. Неиспользуемый init-параметр обозначен явно.

Известная диагностика tooling, владелец Lynx Lab, пересмотр до 2026-12-16: SDK parser
AGP 8.7.0 сообщает “only understands SDK XML versions up to 3 but ... version 4 was
encountered” с установленными новыми metadata Android SDK. Источник — локальная
standalone-сборка 2026-11-16. Это несовпадение metadata вне Kotlin/Android Lint;
диагностика не фильтруется, SDK/host не обновляются. Пересмотреть при изменении
standalone AGP-профиля. Свои compiler/Lint warnings продолжают ронять check.
Общего допуска pod `--allow-warnings` больше нет.

Второе узкое исключение — `GradleDependency` на единственном объявлении
`androidx.annotation:annotation:1.9.1`: Lint предлагает 1.11.0. Сохранена существующая
host-совместимая зависимость; обновление требует отдельного consumer QA. Подавление
в комментарии относится только к этой декларации. Владелец — Lynx Lab; источник —
standalone Android Lint 2026-11-16; пересмотр до 2026-12-16 или при обновлении host-профиля.

## Исключения dependency audit

`bun run check:audit` выполняет настоящий Bun audit с ровно двумя временными исключениями.
Guard падает после 2026-12-16 или при изменении bun.lock: новый граф требует review до
обновления разрешённого hash. Владелец — Lynx Lab. Обе уязвимости остаются неисправленными
в release-only bundle npm 11.21.2; они приняты как исключения, а не объявлены исправленными:

- [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): glob 13.0.6 может продолжать обход после отмены AbortSignal. Цепочка: semantic-release → @semantic-release/npm → npm (и его tooling) → glob. Наши checks не вызывают этот путь обхода/отмены.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): minimatch 10.2.5/10.2.6 усиливает обработку подконтрольных атакующему patterns при optimizationLevel >= 2. Владелец — то же release-only дерево npm; checks не принимают недоверенные glob patterns через этот путь.

Публикация заблокирована. Пересмотр обязателен до снятия блокировки, изменения dependency
graph или приёма недоверенных patterns. Остальные advisories роняют audit. Исправленные
glob 14.0.2 / minimatch 11.0.1 нарушают upstream ranges; принудительного major override нет.
`npm: 11.21.2` — совместимый точечный override: фактические bundled brace-expansion,
selector parser, undici и ip-address проверены, потому что изменение одного bun.lock
не заменяло уязвимые файлы в bundle npm 11.19.0. Vitest остаётся на совместимом patch
4.1.12; исправленные Vite и остальные затронутые transitives закреплены в bun.lock.
Runtime-зависимости crypto не добавлены.

## Consumer gate и физический QA

Поддерживается native-адаптер Sparkling fixture из probe source commit `59dc5e9`:
Sparkling 2.1.0-rc.36 / Lynx и library plugins 3.9.0, Android `:app`,
SparklingGo.xcworkspace со SparklingGoInHouse/Debug и SparklingGo/Release.
Другой layout/schemes требует явно проверенного изменения адаптера. Deployment 15.6 —
override host build, а не доказательство minimum iOS 12.

В собственном изолированном fixture установите точный архив через `bun add /path/package.tgz`,
затем выполните `bundle exec pod install` в `ios` после каждой смены пакета или peer context.
Сохраните app kotlin.kapt / kapt(libs.lynx.processor), settings org.lynxsdk.library-settings
и app org.lynxsdk.library-build. Sparkling navigation autolink не заменяет регистрацию
Lynx. Из корня fixture сгенерируйте оба registry:

```sh
./android/gradlew -p android :app:generateDebugLynxLibraryRegistry \
    :app:generateReleaseLynxLibraryRegistry --no-daemon
CONSUMER_ROOT=/fixture CONSUMER_TARBALL=/package.tgz bun run check:consumer:bindings
CONSUMER_ROOT=/fixture CONSUMER_TARBALL=/package.tgz bun run check:consumer
```

Binding-only gate сравнивает каждый installed byte с архивом и читает actual Gradle Kotlin
compiler sources, runtime project dependencies и Java compiler registry inputs для
Debug/Release. Для iOS проверяются lock/manifest, PBX source/header phases, scheme UUID,
зависимости Pods targets и inherited linker configuration. Canonical roots обязаны совпасть
с установленным архивом; compiled registries должны регистрировать LynxCrypto. Source
filters, conditional filters, неподдерживаемые xcconfig includes и platform-filtered
build files отклоняются. Hashes native sources, registry и configuration inputs сохраняются
в receipt. Старые GlobalStore/Pod paths и registry inputs отклоняются до компиляции;
gate не исправляет host молча. Реализация и regression tests перенесены из принятого
secure-store gate c350fce, включая исправление source filters ef61633.

Compile gate сначала собирает JS host, проверяет bindings, затем собирает Android
Debug/Release с обязательным R8 mapping и unsigned iOS Debug/Release; после build
повторно проверяет hashes inputs. IOS_DEPLOYMENT_TARGET может задавать закреплённый host
override; scheme overrides не поддерживаются. Зависимости/Pods должны быть установлены.
Устройства не устанавливаются и не используются. Outputs остаются в Android build
fixture и ios/build-crypto-consumer. Receipts: artifacts/consumer-bindings.json
(binding-only), artifacts/consumer-build.json (compile-only). Ни один не утверждает
physical QA; отдельные сценарии и exact artifact/toolchain/device evidence описаны
в [совместимости](./docs/compatibility.ru.md).

## Состояние релиза

Прямые `release` и `prepublishOnly` остаются заблокированы. Ручной workflow
prepare → QA → publish сохраняет один неизменяемый архив; см. [порядок выпуска](./docs/releasing.ru.md).
Выберите SemVer и закоммитьте финальные version/changelog до подготовки.
`release:dry-run` — только рекомендательный анализ. Нужны полный source-bound QA и явный
manual publish; успешные локальные checks сами по себе не разрешают публикацию.

## Документация

Обновляйте EN/RU-пары вместе. README краткий; точный API, интеграция, реализация и
совместимость находятся в `docs/` и входят в tarball. Примеры проверяются TypeScript.

## Соглашения commits и выбор версии

Commit prefix помогает выбрать SemVer. Maintainer выбирает и коммитит финальные
version/changelog до prepare; анализ semantic-release рекомендательный.

| Prefix | Bump | Раздел CHANGELOG |
|---|---|---|
| `feat:` | minor | ✨ Features |
| `fix:` | patch | 🐛 Bug Fixes |
| `perf:` | patch | 💨 Performance Improvements |
| `refactor:` | patch | 🔄 Code Refactors |
| `docs:` | patch | 📚 Documentation |
| `chore:` | patch | 🛠️ Other changes |
| `BREAKING CHANGE:` в body | major | отдельный раздел |

Ни один commit автоматически не запускает публикацию.

## Выпуск неизменяемого архива

Ручной workflow prepare → QA → publish описан в [порядке выпуска](./docs/releasing.ru.md).
Он публикует принятый архив без переупаковки semantic-release. Прямая локальная публикация
заблокирована; нужны финальная версия, полный QA и удалённые настройки OIDC/environment.
