import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { SHARED_COLORS_DEFAULT, THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererDarkThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererDarkThemeColor',
    (registrant) => {

        // shared
        Object.entries(SHARED_COLORS_DEFAULT).forEach(([colorName, colorRGBA]) => {
            registrant.registerColor(PresetColorTheme.DarkModern, colorName, colorRGBA);
        });

        // general
        registrant.registerColor(PresetColorTheme.DarkModern, 'global-body-background', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.DarkModern, 'global-body-foreground', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.DarkModern, 'selection-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.DarkModern, 'primary-text', THEME_COLORS.primary); 

        // utility
        registrant.registerColor(PresetColorTheme.DarkModern, 'search-bar-background', THEME_COLORS.stroke); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'search-bar-icon', THEME_COLORS.subtext); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'menu-border', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.DarkModern, 'menu-item-disabled', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.DarkModern, 'menu-separator-background', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.DarkModern, 'menuItem-focus-background', THEME_COLORS.subicon);
        registrant.registerColor(PresetColorTheme.DarkModern, 'sash-hover', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.DarkModern, 'sash-visible-background', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.DarkModern, 'scroll-slider-background', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.DarkModern, 'toggle-collapse-button', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.DarkModern, 'toggle-collapse-button-hover', THEME_COLORS.subtext);

        // NavigationPanel

        // NavigationView
        registrant.registerColor(PresetColorTheme.DarkModern, 'file-tree-arrow-select', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.DarkModern, 'file-tree-arrow-normal', THEME_COLORS.subtext);
        registrant.registerColor(PresetColorTheme.DarkModern, 'file-tree-row-insert-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'file-tree-select-blur-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.DarkModern, 'file-tree-on-drop-background', THEME_COLORS.stroke);

        // Explorer (NavView)

        registrant.registerColor(PresetColorTheme.DarkModern, 'navigation-view-background', THEME_COLORS.sidebg);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-focused-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-selected-foreground', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-selected-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-hovered-background', THEME_COLORS.lighterTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-grag-image-background', THEME_COLORS.stroke);

        // Workspace
        registrant.registerColor(PresetColorTheme.DarkModern, 'window-bar-button-hover-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.DarkModern, 'window-bar-button-active-background', THEME_COLORS.light);
    },
);
