import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export namespace WorkbenchContextKey {

    /** Is the application is in release mode. */
    export const inReleaseContext = CreateContextKeyExpr.Equal('isPackaged', true);

    /** Is the application is in develop mode. */
    export const inDevelopContext = CreateContextKeyExpr.Equal('isPackaged', false);

    export const inMac = CreateContextKeyExpr.Equal('isMac', true);
    export const inLinux = CreateContextKeyExpr.Equal('isLinux', true);
    export const inWindows = CreateContextKeyExpr.Equal('isWindows', true);
    
    // [SideView related]

    export const isVisibleSideView = CreateContextKeyExpr.Equal('visibleSideView', true);
    export const isFocusedSideView = CreateContextKeyExpr.Equal('focusedSideView', true);

    // [end]
}

