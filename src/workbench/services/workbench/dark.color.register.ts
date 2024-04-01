import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { SHARED_COLORS_DEFAULT, THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererDarkThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererDarkThemeColor',
    (registrant) => {

        // shared
        Object.entries(SHARED_COLORS_DEFAULT).forEach(([colorName, colorRGBA]) => {
            registrant.registerColor(PresetColorTheme.LightModern, colorName, colorRGBA);
        });

        // general
        registrant.registerColor(PresetColorTheme.DarkModern, 'selection-background', THEME_COLORS.midnightBlue); 

        // utility
        registrant.registerColor(PresetColorTheme.DarkModern, 'search-bar-background', THEME_COLORS.charcoal); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'menuItem-focus-background', THEME_COLORS.onyx);

        // NavigationPanel

        // NavigationView

        // Explorer (NavView)

        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-focused-background', THEME_COLORS.mediumTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-selected-background', THEME_COLORS.mediumTeal);
        registrant.registerColor(PresetColorTheme.DarkModern, 'explorer-item-hovered-background', THEME_COLORS.lightTeal);

        // Workspace
    },
);