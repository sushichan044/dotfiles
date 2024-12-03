-- Pull in the wezterm API
local wezterm = require 'wezterm'

-- This will hold the configuration.
local config = wezterm.config_builder()

-- WezTerm Behavior
config.automatically_reload_config = true
config.window_close_confirmation = "NeverPrompt"
config.use_ime = true

-- Appearance
config.color_scheme = 'OneHalfDark'
config.font = wezterm.font 'MesloLGS NF'
config.initial_rows = 36
config.initial_cols = 120
config.window_background_opacity = 0.8
config.macos_window_background_blur = 30

-- Cursor
config.default_cursor_style = "BlinkingBar"
config.cursor_thickness = 2.0

-- Character
config.font_size = 13.0

-- Tabs
config.hide_tab_bar_if_only_one_tab = true
config.show_new_tab_button_in_tab_bar = false
config.show_close_tab_button_in_tabs = false
config.tab_and_split_indices_are_zero_based = true
config.tab_max_width = 6


-- This is where you actually apply your config choices

config.window_decorations = "RESIZE"
config.colors = {
    tab_bar = {
        inactive_tab_edge = "none",
    },
}


-- and finally, return the configuration to wezterm
return config
