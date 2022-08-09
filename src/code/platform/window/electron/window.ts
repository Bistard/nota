import { BrowserWindow } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";

/**
 * An interface only for {@link WindowInstance}.
 */
export interface IWindowInstance extends Disposable {
    
    readonly id: number;

    readonly window: BrowserWindow;

    readonly onDidLoad: Register<void>;
    
    readonly onDidClose: Register<void>;

    load(): void;

    close(): void;
}
