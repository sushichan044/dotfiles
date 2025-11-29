# frozen_string_literal: true

# ANSI Color Codes and DSL
class Colors
  RESET = "\033[0m"
  BOLD = "\033[1m"
  DIM = "\033[2m"

  # Foreground colors
  RED = "\033[31m"
  GREEN = "\033[32m"
  YELLOW = "\033[33m"
  BLUE = "\033[34m"
  MAGENTA = "\033[35m"
  CYAN = "\033[36m"
  WHITE = "\033[37m"

  # Background colors
  BG_RED = "\033[41m"
  BG_GREEN = "\033[42m"
  BG_YELLOW = "\033[43m"
  BG_BLUE = "\033[44m"
  BG_MAGENTA = "\033[45m"
  BG_CYAN = "\033[46m"
end

# Color DSL for easy text formatting
class ColorText
  def initialize(text)
    @text = text.to_s
    @codes = []
  end

  def bold
    @codes << Colors::BOLD
    self
  end

  def dim
    @codes << Colors::DIM
    self
  end

  def red
    @codes << Colors::RED
    self
  end

  def green
    @codes << Colors::GREEN
    self
  end

  def yellow
    @codes << Colors::YELLOW
    self
  end

  def blue
    @codes << Colors::BLUE
    self
  end

  def magenta
    @codes << Colors::MAGENTA
    self
  end

  def cyan
    @codes << Colors::CYAN
    self
  end

  def white
    @codes << Colors::WHITE
    self
  end

  def bg_red
    @codes << Colors::BG_RED
    self
  end

  def bg_green
    @codes << Colors::BG_GREEN
    self
  end

  def bg_yellow
    @codes << Colors::BG_YELLOW
    self
  end

  def bg_blue
    @codes << Colors::BG_BLUE
    self
  end

  def bg_magenta
    @codes << Colors::BG_MAGENTA
    self
  end

  def bg_cyan
    @codes << Colors::BG_CYAN
    self
  end

  def to_s
    "#{@codes.join}#{@text}#{Colors::RESET}"
  end
end

def colorize(text)
  ColorText.new(text)
end
