# frozen_string_literal: true

require_relative "./color"
require_relative "./nerd"

# Rails environment information display
#: () -> Array[String]
def show_rails_info
  output = []

  return output unless defined?(Rails)

  rails_env = Rails.env
  rails_version = Rails.version if Rails.respond_to?(:version)

  env_color_method = case rails_env
                    when 'development'
                      :green
                    when 'test'
                      :yellow
                    when 'staging'
                      :magenta
                    when 'production'
                      :red
                    else
                      :blue
                    end

  output << colorize("#{NerdIcons.rails} Rails Environment").bold.magenta
  output << "#{colorize('Environment:').bold} #{colorize(rails_env).send(env_color_method)}"
  output << "#{colorize('Rails:').bold}       #{colorize(rails_version).blue}" if rails_version

  # 本番環境の場合は追加で警告を出す
  if rails_env == 'production'
    output << ""
    output << colorize("DANGER! YOU ARE IN PRODUCTION!").bold.red
    output << colorize("BE EXTREMELY CAREFUL WITH COMMANDS!").bold.red
  end

  output
end
