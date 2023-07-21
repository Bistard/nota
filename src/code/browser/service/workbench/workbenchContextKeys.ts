import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export namespace WorkbenchContextKey {

    /** Is the application is in release mode. */
    export const inReleaseContext = CreateContextKeyExpr.Equal('isPackaged', true);

    /** Is the application is in develop mode. */
    export const inDevelopContext = CreateContextKeyExpr.Equal('isPackaged', false);
}

