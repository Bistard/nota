import { isAbsolute, resolve } from "src/base/common/files/path";
import { Schemas, URI } from "src/base/common/files/uri";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspaceService";

/**
 * @overview
 * This is a common file contains a list of unorganized stuff.
 */

/**
 * @description Resolves the relative path of an image to an absolute path based 
 * on the current opened editor's URI.
 *  - Network source will be returned unchanged.
 *  - Absolute source will be returned unchanged.
 *  - Relative source will be resolved into absolute based on the current opened
 *    editor URI.
 * @returns The resolved path of the image.
 */
export function resolveImagePath(workspaceService: IWorkspaceService, src: string): string {
    const ignored: string[] = [ Schemas.HTTP, Schemas.HTTPS ];
    if (ignored.includes(URI.parse(src).scheme)) {
        return src;
    }

    const absolute = isAbsolute(src);
    if (absolute) {
        return src;
    }
    
    const baseEditorURI = workspaceService.getCurrentEditor();
    if (!baseEditorURI) {
        return src;
    }

    const basePath = URI.toFsPath(URI.dirname(baseEditorURI));
    const resolved = resolve(basePath, src);
    return resolved;
}

