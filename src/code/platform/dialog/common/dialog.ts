
export interface OpenDialogOptions {
    readonly title: string;
    readonly buttonLabel?: string;
    readonly defaultPath?: string;
    readonly forceNewWindow?: boolean;
}

/**
 * SHOULD NOT BE USED DIRECTLY.
 */
export interface InternalOpenDialogOptions extends OpenDialogOptions {
    readonly openFile?: boolean;
    readonly openDirectory?: boolean;
}