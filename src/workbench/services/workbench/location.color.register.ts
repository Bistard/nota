import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const rendererThemeLocationRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeLocation',
    (registrant) => {
        
        // general
        registrant.registerTemplate('global-body-background');
        registrant.registerTemplate('global-body-foreground');
        registrant.registerTemplate('selection-background');
        registrant.registerTemplate('primary-text');

        // utility
        registrant.registerTemplate('search-bar-background');
        registrant.registerTemplate('search-bar-icon');
        registrant.registerTemplate('menu-border');
        registrant.registerTemplate('menu-item-disabled');
        registrant.registerTemplate('menu-separator-background');
        registrant.registerTemplate('menuItem-focus-background');
        registrant.registerTemplate('sash-hover');
        registrant.registerTemplate('sash-visible-background');
        registrant.registerTemplate('scroll-slider-background');
        registrant.registerTemplate('toggle-collapse-button');
        registrant.registerTemplate('toggle-collapse-button-hover');
        
        // NavigationPanel

        // NavigationView
        registrant.registerTemplate('file-tree-arrow-select');
        registrant.registerTemplate('file-tree-arrow-normal');
        registrant.registerTemplate('file-tree-row-insert-background');
        registrant.registerTemplate('file-tree-select-blur-background');
        registrant.registerTemplate('file-tree-on-drop-background');

        // Explorer (NavView)

        registrant.registerTemplate('navigation-view-background');
        registrant.registerTemplate('explorer-item-focused-background');
        registrant.registerTemplate('explorer-item-selected-foreground');
        registrant.registerTemplate('explorer-item-selected-background');
        registrant.registerTemplate('explorer-item-hovered-background');
        registrant.registerTemplate('explorer-item-grag-image-background');

        // Workspace
        registrant.registerTemplate('window-bar-button-hover-background');
        registrant.registerTemplate('window-bar-button-active-background');
    },
);
