-- Pull in the wezterm API
local wezterm = require 'wezterm'

-- This will hold the configuration.
local config = wezterm.config_builder()

-- WezTerm Behavior
config.automatically_reload_config = true
config.window_close_confirmation = "NeverPrompt"
config.use_ime = true
config.window_decorations = "RESIZE"

-- Appearance
local function scheme_for_appearance(appearance)
    if appearance:find "Dark" then
        return "Catppuccin Macchiato"
    else
        return "Catppuccin Latte"
    end
end

config.color_scheme = scheme_for_appearance(wezterm.gui.get_appearance())
config.initial_rows = 36
config.initial_cols = 120
config.window_background_opacity = 0.8
config.macos_window_background_blur = 30

-- Cursor
config.default_cursor_style = "BlinkingBar"
config.cursor_thickness = 2.0

-- Character
config.font = wezterm.font 'MesloLGS NF'
config.font_size = 13.0

-- Tabs
config.show_new_tab_button_in_tab_bar = false
config.show_close_tab_button_in_tabs = false
config.tab_and_split_indices_are_zero_based = true
config.tab_max_width = 18
config.colors = {
    tab_bar = {
        inactive_tab_edge = "none",
    },
}

-- Keybindings
config.keys = {
    {
        key = "m",
        mods = "CMD",
        action = wezterm.action.DisableDefaultAssignment,
    },
    {
        key = "w",
        mods = "CMD",
        action = wezterm.action.CloseCurrentPane { confirm = false },
    },
    {
        key = "d",
        mods = "CMD",
        action = wezterm.action.SplitHorizontal { domain = "CurrentPaneDomain" },
    },
    {
        key = "[",
        mods = "CMD",
        action = wezterm.action.ActivatePaneDirection "Prev"
    },
    {
        key = "]",
        mods = "CMD",
        action = wezterm.action.ActivatePaneDirection "Next"
    },
}

-- Return the Tab's current working directory
local function get_cwd(tab)
    return tab.active_pane.current_working_dir.file_path or ""
end

-- Remove all path components and return only the last value
local function remove_abs_path(path) return path:gsub("(.*[/\\])(.*)", "%2") end

-- Return the pretty path of the tab's current working directory
local function get_display_cwd(tab)
    local current_dir = get_cwd(tab):gsub("/$", "") -- Remove trailing slash
    local HOME_DIR = os.getenv("HOME")

    return current_dir == HOME_DIR and "~" or remove_abs_path(current_dir) .. '/'
end

-- Pretty format the tab title
local function format_title(tab, max_width)
    local pretty_cwd = get_display_cwd(tab)

    if #pretty_cwd > max_width then
        pretty_cwd = wezterm.truncate_right(pretty_cwd, max_width - 3) .. '../'
    end

    return string.format("%s", pretty_cwd)
end

wezterm.on(
    'format-tab-title',
    function(tab, tabs, panes, config, hover, max_width)
        local minimum_title_length = 4 + #tostring(tab.tab_index)
        local title = string.format(
            ' %s: %s ',
            tab.tab_index,
            format_title(tab, max_width - minimum_title_length)
        )

        return {
            { Text = title }
        }
    end
)

-- and finally, return the configuration to wezterm
return config
