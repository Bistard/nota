import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const rendererThemeLocationRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeLocation',
    (registrant) => {
        registrant.registerTemplate('menu-item-focus-background-color');
        registrant.registerTemplate('search-bar-background');
        registrant.registerTemplate('selection-colour');
        registrant.registerTemplate('toolbar-container-background');
        registrant.registerTemplate('light-menu-border-color');
    },
);