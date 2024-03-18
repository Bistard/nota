import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { THEME_COLORS } from "../theme/themeDefaults";
import { PresetColorTheme } from "src/workbench/services/theme/theme";

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