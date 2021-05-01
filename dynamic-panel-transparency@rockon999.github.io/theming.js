/* exported init, cleanup, register_hide_corners, add_hide_corners, remove_hide_corners, remove_maximized_background_color, remove_unmaximized_background_color, set_maximized_background_color, set_unmaximized_background_color, remove_background_color, register_text_shadow, add_text_shadow, register_icon_shadow, add_icon_shadow, has_text_shadow, has_icon_shadow, remove_text_shadow, remove_icon_shadow, register_text_color, set_text_color, remove_text_color, set_panel_color, set_corner_color, clear_corner_color, get_background_image_color, get_background_color, get_maximized_opacity, get_unmaximized_opacity, strip_panel_styling, reapply_panel_styling, strip_panel_background_image, reapply_panel_background_image, strip_panel_background, reapply_panel_background, set_background_alpha */

const St = imports.gi.St;

const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Params = imports.misc.params;

const Settings = Me.imports.settings;
const Util = Me.imports.util;

const GdkPixbuf = imports.gi.GdkPixbuf;
const GLib = imports.gi.GLib;

/* Convenience constant for the shell panel. */
const Panel = Main.panel;

/* Constants for theme opacity detection. */
const THEME_OPACITY_THRESHOLD = 50;

/* Constants for color averaging. */
const SATURATION_WEIGHT = 1.5;
const WEIGHT_THRESHOLD = 1.0;
const ALPHA_THRESHOLD = 24;

/* Scale factor for color conversion. */
const SCALE_FACTOR = 255.9999999;

/**
 * @typedef {Object} Color - Represents a standard color object
 * @property {number} red - Red value ranging from 0-255.
 * @property {number} green - Green value ranging from 0-255.
 * @property {number} blue - Blue value ranging from 0-255.
 * @property {number} [alpha=1.0] - Alpha value ranging from 0-1.0 with support for two decimal places.
 */

/**
 * Intialize.
 *
 */
function init() {
    this.stylesheets = [];
    this.styles = [];

    this.background_styles = [];

    update_transition_css();
}

/**
 * Used to release any held assets of theming.
 *
 */
function cleanup() {
    let theme = St.ThemeContext.get_for_stage(global.stage).get_theme();

    for (let style of this.styles) {
        Panel.remove_style_class_name(style);
    }

    for (let style of this.background_styles) {
        Panel.remove_style_class_name(style);
    }

    for (let sheet of this.stylesheets) {
        theme.unload_stylesheet(Util.get_file(sheet));
        Util.remove_file(sheet);
    }

    this.background_styles = null;
    this.stylesheets = null;
    this.styles = null;
}

/**
 * Registers a shadow stylesheet for text in the panel.
 *
 * @param {Color} text_color - Object representing an RGBA color.
 * @param {Number[]} text_position - Integer array containing horizontal offset, vertical offset, radius. (in that order)
 */
function register_text_shadow(text_color, text_position) {
    let text_color_css = 'rgba(' + text_color.red + ', ' + text_color.green + ', ' + text_color.blue + ', ' + text_color.alpha.toFixed(2) + ')';
    let text_position_css = '' + text_position[0] + 'px ' + text_position[1] + 'px ' + text_position[2] + 'px';

    register_style('dpt-panel-text-shadow');

    return apply_stylesheet_css('.dpt-panel-text-shadow .panel-button { text-shadow: ' + text_position_css + ' ' + text_color_css + '; }', 'foreground/panel-text-shadow');
}

/**
 * Adds the currently registered shadow stylesheet to the text in the panel.
 *
 * @param {Color} text_color - Object representing an RGBA color.
 * @param {Number[]} text_position - Integer array containing horizontal offset, vertical offset, radius. (in that order)
 */
function add_text_shadow() {
    Panel.add_style_class_name('dpt-panel-text-shadow');
}

/**
 * Register a shadow stylesheet for icons in the panel.
 *
 * @param {Color} icon_color - Object representing an RGBA color.
 * @param {Number[]} icon_position - Integer array containing horizontal offset, vertical offset, radius. (in that order)
 */
function register_icon_shadow(icon_color, icon_position) {
    let icon_color_css = 'rgba(' + icon_color.red + ', ' + icon_color.green + ', ' + icon_color.blue + ', ' + icon_color.alpha.toFixed(2) + ')';
    let icon_position_css = '' + icon_position[0] + 'px ' + icon_position[1] + 'px ' + icon_position[2] + 'px';

    let stylesheet = apply_stylesheet_css('.dpt-panel-icon-shadow .system-status-icon { icon-shadow: ' + icon_position_css + ' ' + icon_color_css + '; }\n.dpt-panel-arrow-shadow .popup-menu-arrow { icon-shadow: ' + icon_position_css + ' ' + icon_color_css + '; }', 'foreground/panel-icon-shadow');

    register_style('dpt-panel-icon-shadow');
    register_style('dpt-panel-arrow-shadow');

    return stylesheet;
}

/**
 * Adds the currently register shadow stylesheet to icons in the panel.
 *
 */
function add_icon_shadow() {
    Panel.add_style_class_name('dpt-panel-icon-shadow');
    Panel.add_style_class_name('dpt-panel-arrow-shadow');
}

/**
 * Determines if the panel currently has text shadowing applied.
 *
 * @returns {Boolean} If the panel has text shadowing.
 */
function has_text_shadow() {
    return Panel.has_style_class_name('dpt-panel-text-shadow');
}

/**
 * Determines if the panel currently has icon shadowing applied.
 *
 * @returns {Boolean} If the panel has icon shadowing.
 */
function has_icon_shadow() {
    return (Panel.has_style_class_name('dpt-panel-icon-shadow') || Panel.has_style_class_name('dpt-panel-arrow-shadow'));
}

/**
 * Removes any text shadowing; deregistering the stylesheet and removing the css.
 *
 */
function remove_text_shadow() {
    Panel.remove_style_class_name('dpt-panel-text-shadow');
}
/**
 * Registers a hide corners stylesheet.
 *
 */
function register_hide_corners() {
    let stylesheet = apply_stylesheet_css('.dpt-panel-hide-corners .panel-corner { -panel-corner-radius: 0px; }', 'background/panel-hide-corners');

    register_style('dpt-panel-hide-corners');

    return stylesheet;
}
/**
 * Adds the currently registered hide corners stylesheet to the corners of the panel.
 *
 */
function add_hide_corners() {
    Panel.add_style_class_name('dpt-panel-hide-corners');
}
/**
 * Unhides corners; deregistering the stylesheet and removing the css.
 *
 */
function remove_hide_corners() {
    Panel.remove_style_class_name('dpt-panel-hide-corners');
}

/**
 * Removes any icon shadowing; deregistering the stylesheet and removing the css.
 *
 */
function remove_icon_shadow() {
    Panel.remove_style_class_name('dpt-panel-icon-shadow');
    Panel.remove_style_class_name('dpt-panel-arrow-shadow');
}

/**
 * Registers text & icon coloring.
 *
 * @param {Color} color - Object containing an RGB color value.
 * @param {string} prefix - What prefix to apply to the stylesheet. '-' is the default.
 */
function register_text_color(color, prefix) {
    let color_css = 'color: rgb(' + color.red + ', ' + color.green + ', ' + color.blue + ');';

    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    let stylesheet = apply_stylesheet_css('.dpt-panel' + prefix + 'text-color .panel-button { ' + color_css + ' }\n.dpt-panel' + prefix + 'icon-color .system-status-icon { ' + color_css + ' }\n.dpt-panel' + prefix + 'arrow-color .popup-menu-arrow { ' + color_css + ' }', 'foreground/panel' + prefix + 'text-color');

    register_style('dpt-panel' + prefix + 'text-color');
    register_style('dpt-panel' + prefix + 'icon-color');
    register_style('dpt-panel' + prefix + 'arrow-color');

    return stylesheet;
}

/**
 * Sets which registered text color stylesheet to use for the text coloring. @see register_text_color
 *
 * @param {string} prefix - What stylesheet prefix to retrieve. '-' is the default.
 */
function set_text_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    Panel.add_style_class_name('dpt-panel' + prefix + 'text-color');
    Panel.add_style_class_name('dpt-panel' + prefix + 'icon-color');
    Panel.add_style_class_name('dpt-panel' + prefix + 'arrow-color');
}

/**
 * Remove a registered text color stylesheet from the panel. @see set_text_color
 *
 * @param {string} prefix - What stylesheet prefix to retrieve. '-' is the default.
 */
function remove_text_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    Panel.remove_style_class_name('dpt-panel' + prefix + 'text-color');
    Panel.remove_style_class_name('dpt-panel' + prefix + 'icon-color');
    Panel.remove_style_class_name('dpt-panel' + prefix + 'arrow-color');
}

/**
 * Registers any custom style so that it can be removed when the extension is disabled.
 *
 * @param {string} style - The name of a CSS styling.
 */
function register_style(style) {
    if (this.styles.indexOf(style) === -1) {
        this.styles.push(style);
    }
}

/**
 * Set's the panel corners' actors to a specific background color.
 *
 * @param {Color} color [color={}] - Object containing an RGBA color value.
 */
// TODO: Gnome needs CSS styling for the corners.
function set_corner_color(color) {
    let panel_color = get_background_color();

    color = Params.parse(color, {
        red: panel_color.red,
        green: panel_color.green,
        blue: panel_color.blue,
        alpha: 0
    });

    let opacity = Util.clamp(color.alpha / SCALE_FACTOR, 0, 1).toFixed(2);

    /* I strongly dislike using a deprecated method (set_style)
     * but this is a hold over from the older extension code and
     * the only way to keep per-app coloring working with corners. */
    let coloring = '-panel-corner-background-color: rgba(' + color.red + ', ' + color.green + ', ' + color.blue + ', ' + opacity + ');' +
        '' + '-panel-corner-border-color: transparent;';

    // TODO: Update this code. We're using @deprecated code.
    Panel._leftCorner.set_style(coloring);
    Panel._rightCorner.set_style(coloring);
}

/**
 * Removes any corner styling this extension has applied.
 *
 */
function clear_corner_color() {
    Panel._leftCorner.set_style(null);
    Panel._rightCorner.set_style(null);
}

/**
 * Returns the user's desired panel color from Settings. Handles theme detection again.
 * DEPENDENCY: Settings
 *
 * @returns {Object} Object containing an RGBA color value.
 */
function get_background_color() {
    if (!Settings.enable_custom_background_color()) {
        return {
            red: 0,
            blue: 0,
            green: 0
        };
    }

    return Settings.get_panel_color();
}

/**
 * Returns the user's desired maximized panel opacity from Settings or their theme.
 * DEPENDENCY: Settings
 * TODO: Needs better system to determine when default theme opacities are too low.
 *
 * @returns {Number} Alpha value from 0-255.
 */
function get_maximized_opacity() {
    let maximized_opacity = Settings.get_maximized_opacity();

    if (!Settings.enable_custom_opacity()) {
        return 255;
    } else {
        return maximized_opacity;
    }
}

/**
 * Returns the user's desired unmaximized panel opacity from Settings or their theme.
 * DEPENDENCY: Settings
 *
 * @returns {Number} Alpha value from 0-255.
 */
function get_unmaximized_opacity() {
    if (Settings.enable_custom_opacity()) {
        return Settings.get_unmaximized_opacity();
    } else {
        return 50;
    }
}

/**
 * Applies the style class 'panel-transparency' which makes the panel fully transparent.
 *
 */
function apply_panel_transparency() {
    Panel.add_style_class_name('panel-transparency');
}

/**
 * Applies the style class 'panel-transparency' which makes the panel fully transparent.
 *
 */
function remove_panel_transparency() {
    Panel.remove_style_class_name('panel-transparency');
}

/**
 * Applies the style class 'panel-effect-transparency' and removes the basic CSS preventing this extension's transitions.
 *
 */
function strip_panel_styling() {
    Panel.add_style_class_name('panel-effect-transparency');
}

/**
 * Removes the style class 'panel-effect-transparency' and enables the stock CSS preventing this extension's transitions.
 *
 */
function reapply_panel_styling() {
    Panel.remove_style_class_name('panel-effect-transparency');
}

/**
 * Applies the style class 'panel-background-image-transparency' and removes the basic CSS preventing this extension's transitions.
 *
 */
function strip_panel_background_image() {
    Panel.add_style_class_name('panel-background-image-transparency');
}

/**
 * Removes the style class 'panel-background-image-transparency' and enables the stock CSS preventing this extension's transitions.
 *
 */
function reapply_panel_background_image() {
    Panel.remove_style_class_name('panel-background-image-transparency');
}

/**
 * Writes CSS data to a file and loads the stylesheet into the Shell.
 *
 * @param {string} css - CSS data.
 * @param {string} name - Name of the intended CSS stylesheet.
 *
 * @returns {string} Filename of the stylesheet.
 */
function apply_stylesheet_css(css, name) {
    let file_name = GLib.build_filenamev([GLib.get_user_data_dir(), 'gnome-shell', 'extensions', Me.uuid, 'styles', name + '.dpt.css']);

    /* Write to the file. */
    if (!Util.write_to_file(file_name, css)) {
        log('[Dynamic Panel Transparency] Could not access: ' + file_name + '');
        log('[Dynamic Panel Transparency] The extension will not function until access is granted.');
        return null;
    }

    let theme = St.ThemeContext.get_for_stage(global.stage).get_theme();

    if (theme.load_stylesheet(Util.get_file(file_name))) {
        this.stylesheets.push(file_name);
    } else {
        log('[Dynamic Panel Transparency] Error Loading Temporary Stylesheet: ' + name);
        return null;
    }

    return file_name;
}

/* Backend24 (3.24+) Specific Functions (Not backwards compatible) */

function initialize_background_styles() {
    register_background_color(Settings.get_panel_color(), 'custom');
    register_background_color({
        red: 0,
        green: 0,
        blue: 0
    });
}

function cleanup_background_styles() {
    remove_background_color();
}

function register_background_style(style) {
    if (this.background_styles.indexOf(style) === -1) {
        this.background_styles.push(style);
    }
}

function register_background_color(bg_color, prefix) {
    let suffix = (prefix ? '-' + prefix : '');

    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    let maximized_opacity = Util.clamp(get_maximized_opacity() / SCALE_FACTOR, 0, 1).toFixed(2);
    let unmaximized_opacity = Util.clamp(get_unmaximized_opacity() / SCALE_FACTOR, 0, 1).toFixed(2);

    let maximized_bg_color_css = 'rgba(' + bg_color.red + ', ' + bg_color.green + ', ' + bg_color.blue + ', ' + maximized_opacity + ')';
    let unmaximized_bg_color_css = 'rgba(' + bg_color.red + ', ' + bg_color.green + ', ' + bg_color.blue + ', ' + unmaximized_opacity + ')';

    register_background_style('dpt-panel' + prefix + 'maximized');
    register_background_style('dpt-panel' + prefix + 'unmaximized');

    let file_prefix = 'background/panel';

    let panel = apply_stylesheet_css('.dpt-panel' + prefix + 'unmaximized { background-color: ' + unmaximized_bg_color_css + '; }\n.dpt-panel' + prefix + 'maximized { background-color: ' + maximized_bg_color_css + '; }', file_prefix + suffix);

    return panel;
}

function set_unmaximized_background_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    let style = 'dpt-panel' + prefix + 'unmaximized';

    Panel.add_style_class_name(style);
}

function set_maximized_background_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    let style = 'dpt-panel' + prefix + 'maximized';

    Panel.add_style_class_name(style);
}

function remove_unmaximized_background_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    Panel.remove_style_class_name('dpt-panel' + prefix + 'unmaximized');
}

function remove_maximized_background_color(prefix) {
    if (prefix) {
        prefix = '-' + prefix + '-';
    } else {
        prefix = '-';
    }

    Panel.remove_style_class_name('dpt-panel' + prefix + 'maximized');
}

function remove_background_color() {
    remove_unmaximized_background_color('custom');
    remove_unmaximized_background_color();

    remove_maximized_background_color('custom');
    remove_maximized_background_color();
}

function update_transition_css() {
    let duration_css = Settings.get_transition_speed();

    let stylesheet = apply_stylesheet_css('.dpt-panel-transition-duration { transition-duration: ' + duration_css + 'ms; }', 'transitions/panel-transition-duration');

    Panel.add_style_class_name('dpt-panel-transition-duration');

    register_style('dpt-panel-transition-duration');

    return stylesheet;
}
