# frozen_string_literal: true

require_relative "./color"

# Ruby version and platform information display
#: () -> Array[String]
def show_ruby_info
  output = []

  ruby_version = RUBY_VERSION
  ruby_patchlevel = RUBY_PATCHLEVEL
  ruby_platform = RUBY_PLATFORM
  ruby_engine = defined?(RUBY_ENGINE) ? RUBY_ENGINE : 'ruby'

  output << colorize("🔧 Ruby Environment").bold.magenta
  output << "#{colorize('Engine:').bold}     #{colorize(ruby_engine).green}"
  output << "#{colorize('Version:').bold}    #{colorize(ruby_version).yellow} #{colorize("(patchlevel #{ruby_patchlevel})").dim}"
  output << "#{colorize('Platform:').bold}   #{colorize(ruby_platform).blue}"
  output << "#{colorize('Encoding:').bold}   #{colorize(Encoding.default_external).white} / #{colorize(Encoding.default_internal || 'nil').white}"

  output
end
