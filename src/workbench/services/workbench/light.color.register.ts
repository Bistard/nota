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
        registrant.registerColor(PresetColorTheme.LightModern, 'selection-background', THEME_COLORS.lightSkyBlue); 

        // utility
        registrant.registerColor(PresetColorTheme.LightModern, 'search-bar-background', THEME_COLORS.ghostWhite); 
        registrant.registerColor(PresetColorTheme.LightModern, 'menuItem-focus-background', THEME_COLORS.seaGreen);

        // NavigationPanel
        // Workspace
    },
);
