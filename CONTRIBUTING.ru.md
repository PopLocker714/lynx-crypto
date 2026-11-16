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

## Consumer gate и физический QA

В изолированном Sparkling fixture установите точный tarball командой
`bun add /path/package.tgz`, выполните `bundle exec pod install` в `ios`, затем:

```sh
CONSUMER_ROOT=/absolute/path/to/fixture \
CONSUMER_TARBALL=/absolute/path/to/package.tgz bun run check:consumer
```

Команда сравнивает каждый установленный файл пакета с архивом, собирает JS host,
Android Debug/Release с обязательным R8 mapping и unsigned iOS Debug/Release.
Defaults: workspace SparklingGo.xcworkspace, schemes SparklingGoInHouse/SparklingGo,
deployment 15.6. Для закреплённого профиля задайте IOS_DEBUG_SCHEME, IOS_RELEASE_SCHEME,
IOS_DEPLOYMENT_TARGET. Зависимости/Pods должны быть установлены заранее. Устройства
не устанавливаются и не используются. Outputs остаются в Android build fixture и
`ios/build-crypto-consumer`; receipt — `artifacts/consumer-build.json`, статус compile-only.
Физические сценарии и точные toolchain/device evidence описаны в [совместимости](./docs/compatibility.ru.md).

## Состояние релиза

Публикация намеренно заблокирована `scripts/release-preflight.mjs` в ручном Release
workflow. Конфигурация semantic-release сохранена; dry-run доступен после reusable CI
того же commit. Это известный незавершённый этап релиза, не immutable-artifact gate.
Следующий шаг: подготовка version/changelog → immutable tarball → consumer QA этого
tarball → публикация точно того же tarball. Не обходите блокировку через environment.
Публикация требует отдельного согласования.

## Документация

Обновляйте EN/RU-пары вместе. README краткий; точный API, интеграция, реализация и
совместимость находятся в `docs/` и входят в tarball. Примеры проверяются TypeScript.

## Версию определяют commits

Версии вручную не меняются: semantic-release читает историю. Commit prefix определяет bump.

| Prefix | Bump | Раздел CHANGELOG |
|---|---|---|
| `feat:` | minor | ✨ Features |
| `fix:` | patch | 🐛 Bug Fixes |
| `perf:` | patch | 💨 Performance Improvements |
| `refactor:` | patch | 🔄 Code Refactors |
| `docs:` | patch | 📚 Documentation |
| `chore:` | patch | 🛠️ Other changes |
| `BREAKING CHANGE:` в body | major | отдельный раздел |

Commit без распознанного prefix не запускает релиз.
