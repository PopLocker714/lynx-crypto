// Версии плагинов намеренно отсутствуют. Autolink-библиотека собирается как
// Gradle-сабпроект хостового приложения (LynxLibrarySettingsPlugin делает
// settings.include(projectPath) + projectDir = androidDir), поэтому версии
// задаёт сборка хоста. Для standalone-проверки их подставляет ../android-check.
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    // НЕ ОПЦИОНАЛЬНО. LynxLibraryBuildPlugin прокидывает аргумент процессора
    // -Alynx.library.packageName только внутри
    //   project.plugins.withId('kotlin-kapt') { ... }
    // и сам плагин никогда не применяет. Без kapt здесь
    // LynxLibraryProcessor.getProviderPackageName() вернёт "" и процессор
    // выйдет, не записав ни одного файла. Без ошибки.
    // Именно kapt, не ksp: lynx-processor это javax.annotation.processing
    // AbstractProcessor, а плагин ищет 'kotlin-kapt' по id.
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "dev.lynxlab.crypto"
    compileSdk = 35

    defaultConfig {
        // SecureRandom это API 1, android.util.Base64 это API 8.
        // Нижнюю границу задаёт Lynx, а не эта библиотека.
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
    }

    // Java 11, а не 17, СОЗНАТЕЛЬНО. Шаблон Sparkling везёт Java 11 и Kotlin
    // 1.8.10 (обе линии, latest и rc), и библиотека на 17 туда не встаёт:
    // bytecode 61 не читается компилятором, таргетящим 11. Требовать от
    // потребителя апгрейд всего тулчейна ради двадцати строк SecureRandom —
    // налог на внедрение. Всё используемое здесь существует с API 8.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    // Старый DSL, а не kotlin { compilerOptions { } }: последний стабилен
    // только с KGP 1.9, а шаблон на 1.8.10.
    kotlinOptions {
        jvmTarget = "11"
        if (project.findProperty("lynxCryptoStrictChecks") == "true") {
            // Standalone KGP 2.0.21: kapt uses language 1.9. Keep host defaults untouched.
            languageVersion = "1.9"
            allWarningsAsErrors = true
        }
    }
    lint {
        warningsAsErrors = project.findProperty("lynxCryptoStrictChecks") == "true"
        abortOnError = true
    }
}

dependencies {
    // compileOnly, не implementation: Lynx поставляет хост, а отгрузка его
    // как implementation рискует duplicate-class.
    compileOnly("org.lynxsdk.lynx:lynx:4.0.1")

    // Сгенерированный LynxLibraryProviderImpl помечается @androidx.annotation.Keep,
    // поэтому androidx.annotation должен быть на compile classpath.
    // Keep the existing host-compatible dependency profile; upgrades need consumer QA.
    // Owner: Lynx Lab. Revisit by 2026-12-16. See CONTRIBUTING.md.
    //noinspection GradleDependency
    compileOnly("androidx.annotation:annotation:1.9.1")

    kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")
}
