import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export namespace WorkbenchContextKey {

    /** Is the application is in release mode. */
    export const inReleaseContext = CreateContextKeyExpr.Equal('isPackaged', true);

    /** Is the application is in develop mode. */
    export const inDevelopContext = CreateContextKeyExpr.Equal('isPackaged', false);

    export const inMac = CreateContextKeyExpr.Equal('isMac', true);
    export const inLinux = CreateContextKeyExpr.Equal('isLinux', true);
    export const inWindows = CreateContextKeyExpr.Equal('isWindows', true);
    
    // [Platform]

    const inputFocusedKey = 'inputFocused';
    export const inputFocused = CreateContextKeyExpr.Equal(inputFocusedKey, true);

    // [SideView]

    export const isVisibleSideView = CreateContextKeyExpr.Equal('visibleSideView', true);
    export const isFocusedSideView = CreateContextKeyExpr.And(
        CreateContextKeyExpr.Equal('focusedSideView', true), 
        CreateContextKeyExpr.Not(inputFocusedKey),
    );

    // [FileTree]

    export const visibleFileTree = CreateContextKeyExpr.Equal('visibleFileTree', true);
    export const focusedFileTree = CreateContextKeyExpr.And(
        CreateContextKeyExpr.Equal('focusedFileTree', true),
        CreateContextKeyExpr.Not(inputFocusedKey),
    );
}

