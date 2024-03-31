import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const rendererThemeLocationRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeLocation',
    (registrant) => {
        
        // general
        registrant.registerTemplate('selection-color');

        // utility
        registrant.registerTemplate('search-bar-background');
        registrant.registerTemplate('menu-item-focus-background-color');

        // NavigationPanel
        // Workspace
    },
);
