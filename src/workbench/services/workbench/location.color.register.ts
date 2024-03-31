import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const rendererThemeLocationRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeLocation',
    (registrant) => {
        
        // general
        registrant.registerTemplate('selection-background');

        // utility
        registrant.registerTemplate('search-bar-background');
        registrant.registerTemplate('menuItem-focus-background');

        // NavigationPanel
        // Workspace
    },
);
