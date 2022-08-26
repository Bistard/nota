import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ITheme } from "src/code/browser/service/theme/theme";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IThemeService = createService<IThemeService>('theme-service');

export interface IThemeService {
    
    readonly onDidChangeTheme: Register<ITheme>;
    
    getTheme(): ITheme;

}

export class ThemeService extends Disposable implements IThemeService {

    // [event]

    private readonly _onDidChangeTheme = this.__register(new Emitter<ITheme>());
    public readonly onDidChangeTheme = this._onDidChangeTheme.registerListener;

    // [field]

    private _currTheme!: ITheme;

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    public getTheme(): ITheme {
        return this._currTheme;
    }

}