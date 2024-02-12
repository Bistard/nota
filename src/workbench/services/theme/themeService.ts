import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IColorTheme } from "src/workbench/services/theme/theme";
import { APP_DIR_NAME, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { URI } from "src/base/common/files/uri";
import { AsyncResult } from "src/base/common/result";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";

export const IThemeService = createService<IThemeService>('theme-service');

/**
 * An interface only for {@link ThemeService}.
 */
export interface IThemeService extends IService {

    /**
     * The root path that stores all the theme files (JSON files).
     */
    readonly themeRootPath: URI;

    /**
     * Fires the latest {@link IColorTheme} whenever the theme is changed.
     */
    readonly onDidChangeTheme: Register<IColorTheme>;

    /**
     * @description Get the current color theme ({@link IColorTheme}).
     */
    getTheme(): IColorTheme;

    /**
     * @description Changes the current theme to the new one.
     * @param id If the id is an URI, the service will try to read the URI
     *           as a JSON file for theme data. If id is an string, it will be
     *           considered as the JSON file name to read at the {@link themeRootPath}.
     * 
     * @note When the AsyncResult is resolved as ok, means the new theme is 
     *       loaded successfully and returned. Otherwise an Error must encountered.
     */
    changeThemeTo(id: string): AsyncResult<IColorTheme, Error>;
}

/**
 * @class // TODO
 */
export class ThemeService extends Disposable implements IThemeService {

    declare _serviceMarker: undefined;

    // [events]

    private readonly _onDidChangeTheme = this.__register(new Emitter<IColorTheme>());
    public readonly onDidChangeTheme = this._onDidChangeTheme.registerListener;

    // [field]

    public readonly themeRootPath: URI;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        super();
        this.themeRootPath = URI.join(environmentService.appRootPath, APP_DIR_NAME, 'theme');
    }
    
    // [public methods]

    public getTheme(): IColorTheme {
        throw new Error("Method not implemented.");
    }
    
    public changeThemeTo(id: string): AsyncResult<IColorTheme, Error> {
        throw new Error("Method not implemented.");
    }
}
