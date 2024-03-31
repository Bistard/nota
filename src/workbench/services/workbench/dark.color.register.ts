import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererDarkThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {

        // general
        registrant.registerColor(PresetColorTheme.DarkModern, 'selection-color', THEME_COLORS.midnightBlue); 

        // utility
        registrant.registerColor(PresetColorTheme.DarkModern, 'search-bar-background', THEME_COLORS.charcoal); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'menu-item-focus-background-color', THEME_COLORS.onyx);

        // NavigationPanel
        // Workspace
    },
);