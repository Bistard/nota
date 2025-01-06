import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";

export const rendererThemeLocationRegister = createRegister(
    RegistrantType.Color,
    'rendererThemeLocation',
    (registrant) => {
        
        // general
        registrant.registerTemplate('primary-text');
        registrant.registerTemplate('global-body-background');
        registrant.registerTemplate('global-body-foreground');
        registrant.registerTemplate('selection-background');
        registrant.registerTemplate('button-background');

        // utility
        registrant.registerTemplate('search-bar-border');
        registrant.registerTemplate('search-bar-icon');
        registrant.registerTemplate('search-bar-placeholder');
        registrant.registerTemplate('menu-background');
        registrant.registerTemplate('menu-border');
        registrant.registerTemplate('menu-item-disabled');
        registrant.registerTemplate('menu-item-check-color');
        registrant.registerTemplate('menu-item-content-color');
        registrant.registerTemplate('menu-separator-background');
        registrant.registerTemplate('menu-item-focus-background');
        registrant.registerTemplate('sash-hover');
        registrant.registerTemplate('sash-visible-background');
        registrant.registerTemplate('scroll-slider-background');
        registrant.registerTemplate('toggle-collapse-button');
        registrant.registerTemplate('toggle-collapse-button-hover');
        registrant.registerTemplate('drop-cursor');
        
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
        registrant.registerTemplate('explorer-item-drag-image-background');

        // Workspace
        registrant.registerTemplate('outline-primary-text');
        registrant.registerTemplate('outline-select-text');
        registrant.registerTemplate('outline-overflow-hover-box-background');

        // Notification
        registrant.registerTemplate('notification-background');
        registrant.registerTemplate('notification-primary-text');
        registrant.registerTemplate('notification-secondary-text');
        registrant.registerTemplate('notification-on-dark-text');
        registrant.registerTemplate('notification-info-primary');
        registrant.registerTemplate('notification-warning-primary');
        registrant.registerTemplate('notification-error-primary');
        registrant.registerTemplate('notification-info-hover');
        registrant.registerTemplate('notification-warning-hover');
        registrant.registerTemplate('notification-error-hover');
    },
);
