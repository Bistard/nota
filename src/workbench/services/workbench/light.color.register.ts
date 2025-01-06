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
        registrant.registerColor(PresetColorTheme.LightModern, 'primary-text', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'global-body-background', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.LightModern, 'global-body-foreground', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'selection-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'button-background', THEME_COLORS.lightstroke);

        // utility
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-icon', THEME_COLORS.subtext); 
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-background', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-border', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-disabled', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-check-color', THEME_COLORS.teal);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-content-color', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-separator-background', THEME_COLORS.lightstroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-focus-background', THEME_COLORS.lighterTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'sash-hover', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'sash-visible-background', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'scroll-slider-background', THEME_COLORS.middle);
        registrant.registerColor(PresetColorTheme.LightModern, 'toggle-collapse-button', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'toggle-collapse-button-hover', THEME_COLORS.subtext);
        registrant.registerColor(PresetColorTheme.LightModern, 'drop-cursor', THEME_COLORS.teal);

        // NavigationPanel
        registrant.registerColor(PresetColorTheme.LightModern, 'quick-access-bar-menu-button-foreground', THEME_COLORS.mediumTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'quick-access-bar-menu-button-foreground-hover', THEME_COLORS.teal);
        registrant.registerColor(PresetColorTheme.LightModern, 'action-bar-add-new-button', THEME_COLORS.lightTeal);

        // NavigationView
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-arrow-select', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-arrow-normal', THEME_COLORS.subtext);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-row-insert-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-select-blur-background', THEME_COLORS.stroke);
        registrant.registerColor(PresetColorTheme.LightModern, 'file-tree-on-drop-background', THEME_COLORS.stroke);

        // Explorer (NavView)

        registrant.registerColor(PresetColorTheme.LightModern, 'navigation-panel-background', THEME_COLORS.sidebg);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-focused-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-selected-foreground', THEME_COLORS.primary);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-selected-background', THEME_COLORS.lightTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-hovered-background', THEME_COLORS.lighterTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'explorer-item-drag-image-background', THEME_COLORS.stroke);

        // Workspace
        registrant.registerColor(PresetColorTheme.LightModern, 'outline-primary-text', THEME_COLORS.ternary);
        registrant.registerColor(PresetColorTheme.LightModern, 'outline-select-text', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'outline-overflow-hover-box-background', THEME_COLORS.white);

        // Notification
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-background', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-primary-text', THEME_COLORS.secondary);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-secondary-text', THEME_COLORS.subtext);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-on-dark-text', THEME_COLORS.white);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-info-primary', THEME_COLORS.teal);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-warning-primary', THEME_COLORS.goldenrod);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-error-primary', THEME_COLORS.crimson);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-info-hover', THEME_COLORS.lighterTeal);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-warning-hover', THEME_COLORS.lightgoldenrod);
        registrant.registerColor(PresetColorTheme.LightModern, 'notification-error-hover', THEME_COLORS.lightcrimson);
    },
);
