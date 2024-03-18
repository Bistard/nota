import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";
import { THEME_COLORS } from "src/workbench/services/theme/themeDefaults";

export const rendererLightThemeColorRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeColor',
    (registrant) => {
        registrant.registerColor(PresetColorTheme.LightModern, 'sidebar-background-color', THEME_COLORS.seaGreen);
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor(PresetColorTheme.LightModern, 'selection-colour', THEME_COLORS.lightSkyBlue); 
        registrant.registerColor(PresetColorTheme.LightModern, 'toolbar-container-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor(PresetColorTheme.LightModern, 'light-menu-border-color', THEME_COLORS.gainsboro); 
    },
);
