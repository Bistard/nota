import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererLightThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererLightThemeColor',
    (registrant) => {

        // general
        registrant.registerColor(PresetColorTheme.LightModern, 'selection-color', THEME_COLORS.lightSkyBlue); 

        // utility
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor(PresetColorTheme.LightModern, 'menu-item-focus-background-color', THEME_COLORS.seaGreen);

        // NavigationPanel
        // Workspace
    },
);
