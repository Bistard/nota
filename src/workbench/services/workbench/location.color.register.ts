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
        registrant.registerTemplate('search-bar-border');
        registrant.registerTemplate('search-bar-icon');
        registrant.registerTemplate('search-bar-placeholder');
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
        registrant.registerTemplate('quick-access-bar-menu-button-foreground');
        registrant.registerTemplate('quick-access-bar-menu-button-foreground-hover');
        registrant.registerTemplate('action-bar-add-new-button');

        // NavigationView
        registrant.registerTemplate('file-tree-arrow-select');
        registrant.registerTemplate('file-tree-arrow-normal');
        registrant.registerTemplate('file-tree-row-insert-background');
        registrant.registerTemplate('file-tree-select-blur-background');
        registrant.registerTemplate('file-tree-on-drop-background');

        // Explorer (NavView)

        registrant.registerTemplate('navigation-panel-background');
        registrant.registerTemplate('explorer-item-focused-background');
        registrant.registerTemplate('explorer-item-selected-foreground');
        registrant.registerTemplate('explorer-item-selected-background');
        registrant.registerTemplate('explorer-item-hovered-background');
        registrant.registerTemplate('explorer-item-grag-image-background');
        registrant.registerTemplate('filter-by-tag-icon');
        registrant.registerTemplate('filter-by-tag-text');
        registrant.registerTemplate('file-button-background');
        registrant.registerTemplate('file-button-background-hover');
        registrant.registerTemplate('file-button-foreground');
        registrant.registerTemplate('file-button-foreground-hover');
        registrant.registerTemplate('file-button-foreground-active');
        registrant.registerTemplate('file-button-box-shadow-active');

        // Workspace
        registrant.registerTemplate('window-bar-button-hover-background');
        registrant.registerTemplate('window-bar-button-active-background');
        registrant.registerTemplate('outline-primary-text');
        registrant.registerTemplate('outline-select-text');
        registrant.registerTemplate('outline-overflow-hover-box-background');
    },
);
