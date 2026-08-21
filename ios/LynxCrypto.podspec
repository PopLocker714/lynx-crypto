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

  # >= 3.9, а не ~> 4.0: шаблон Sparkling пинит под Lynx на 3.9.0, и
  # ~> 4.0 сделал бы набор требований неразрешимым.
  s.dependency "Lynx", ">= 3.9"
end
