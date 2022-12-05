import { CreateContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";

/**
 * A list of useful context key expression in workbench.
 */

/** Is the application is in release mode. */
export const inReleaseContext = CreateContextKeyExpr.Equal('isPackaged', true);

/** Is the application is in develop mode. */
export const inDevelopContext = CreateContextKeyExpr.NotEqual('isPackaged', false);

