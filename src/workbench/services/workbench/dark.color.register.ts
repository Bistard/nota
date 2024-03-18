import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { THEME_COLORS } from "../theme/themeColors";

export const rendererDarkThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        registrant.registerColor('dark', 'menu-item-focus-background-color', THEME_COLORS.onyx);
        registrant.registerColor('dark', 'search-bar-background', THEME_COLORS.charcoal); 
        registrant.registerColor('dark', 'selection-colour', THEME_COLORS.midnightBlue); 
        registrant.registerColor('dark', 'toolbar-container-background', THEME_COLORS.ebony); 
        registrant.registerColor('dark', 'light-menu-border-color', THEME_COLORS.outerSpace); 
    },
);