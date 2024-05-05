import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { SHARED_COLORS_DEFAULT, THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererLightThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererLightThemeColor',
    (registrant) => {

        // shared
        Object.entries(SHARED_COLORS_DEFAULT).forEach(([colorName, colorRGBA]) => {
            registrant.registerColor(PresetColorTheme.LightModern, colorName, colorRGBA);
        });

        // general
        registrant.registerColor(PresetColorTheme.LightModern, 'global-body-background', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.LightModern, 'global-body-foreground', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'selection-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'primary-text', THEME_COLORS.primary); 

        // utility
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-background', THEME_COLORS.stroke); 
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-icon', THEME_COLORS.subtext); 
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-border', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-disabled', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-separator-background', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'menuItem-focus-background', THEME_COLORS.subicon);
        registrant.registerColor(PresetColorTheme.LightModern, 'sash-hover', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'sash-visible-background', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'scroll-slider-background', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'toggle-collapse-button', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'toggle-collapse-button-hover', THEME_COLORS.subtext);

        // NavigationPanel

        // NavigationView
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-arrow-select', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-arrow-normal', THEME_COLORS.subtext);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-row-insert-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-select-blur-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-on-drop-background', THEME_COLORS.stroke);

        // Explorer (NavView)

        registrant.registerColor(PresetColorTheme.LightModern, 'navigation-view-background', THEME_COLORS.sidebg);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-focused-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-selected-foreground', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-selected-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-hovered-background', THEME_COLORS.lighterTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-grag-image-background', THEME_COLORS.stroke);

        // Workspace
        registrant.registerColor(PresetColorTheme.LightModern, 'window-bar-button-hover-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'window-bar-button-active-background', THEME_COLORS.light);
    },
);
