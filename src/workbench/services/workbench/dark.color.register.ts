import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererDarkThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        registrant.registerColor(PresetColorTheme.DarkModern, 'menu-item-focus-background-color', THEME_COLORS.onyx);
        registrant.registerColor(PresetColorTheme.DarkModern, 'search-bar-background', THEME_COLORS.charcoal); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'selection-colour', THEME_COLORS.midnightBlue); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'toolbar-container-background', THEME_COLORS.ebony); 
        registrant.registerColor(PresetColorTheme.DarkModern, 'light-menu-border-color', THEME_COLORS.outerSpace); 
    },
);