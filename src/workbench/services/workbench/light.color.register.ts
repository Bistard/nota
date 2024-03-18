import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { THEME_COLORS } from "../theme/themeColors";

export const rendererLightThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        registrant.registerColor('light', 'sidebar-background-color', THEME_COLORS.seaGreen);
        registrant.registerColor('light', 'search-bar-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor('light', 'selection-colour', THEME_COLORS.lightSkyBlue); 
        registrant.registerColor('light', 'toolbar-container-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor('light', 'light-menu-border-color', THEME_COLORS.gainsboro); 
    },
);
