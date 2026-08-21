require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))

Pod::Spec.new do |s|
  s.name         = "LynxCrypto"
  s.version      = package["version"] == "0.0.0-development" ? "0.0.1" : package["version"]
  s.summary      = "Cryptographically secure random values for Lynx"
  s.description  = package["description"]
  s.homepage     = "https://github.com/PopLocker714/lynx-crypto"
  s.license      = { :type => "MIT", :file => "../LICENSE" }
  s.author       = { "PopLocker714" => "jonirootman714@gmail.com" }
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/PopLocker714/lynx-crypto.git", :tag => "v#{s.version}" }

  s.source_files = "src/**/*.{h,m}"
  s.frameworks   = "Security"

  # Без ограничения версии, и это проверено на устройстве.
  # Зависимость нужна ради header search paths (без неё
  # <Lynx/LynxModule.h> не находится), но любой пин ломает резолв:
  # шаблон Sparkling пинит Lynx 3.6.0, а поды Lynx 4.x на CocoaPods
  # не резолвятся вовсе из-за конфликта LynxServiceAPI.
  s.dependency "Lynx"
end
