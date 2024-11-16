import { Color } from "src/base/common/color";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { InitProtector } from "src/base/common/error";
import { Shortcut } from "src/base/common/keyboard";
import { HashNumber } from "src/base/common/utilities/hash";
import { iterPropEnumerable } from "src/base/common/utilities/object";
import { isObject } from "src/base/common/utilities/type";
import { ICommandBasicSchema, ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ICommandService } from "src/platform/command/common/commandService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IContextKey } from "src/platform/context/common/contextKey";
import { IContextService } from "src/platform/context/common/contextService";
import { ipcRenderer, safeIpcRendererOn, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { IBrowserInspectorService, InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IShortcutReference, IShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import { IColorTheme } from "src/workbench/services/theme/colorTheme";
import { IThemeService } from "src/workbench/services/theme/themeService";

export class BrowserInspectorService implements IBrowserInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _initProtector: InitProtector;
    private _lifecycle: DisposableManager;
    private _currentListenTo?: InspectorDataType;

    private readonly commandRegistrant: ICommandRegistrant;
    private readonly shortcutRegistrant: IShortcutRegistrant;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IContextService private readonly contextService: IContextService,
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @IThemeService private readonly themeService: IThemeService,
    ) {
        this._lifecycle = new DisposableManager();
        this._initProtector = new InitProtector();
        this.commandRegistrant = this.registrantService.getRegistrant(RegistrantType.Command);
        this.shortcutRegistrant = this.registrantService.getRegistrant(RegistrantType.Shortcut);
    }

    // [public methods]

    public startListening(): void {
        this._initProtector.init('[BrowserInspectorService] Cannot initialize twice').unwrap();
        safeIpcRendererOn(IpcChannel.InspectorReady, (e, listenToDataType: InspectorDataType) => {
            this.startListenTo(listenToDataType);
        });
        safeIpcRendererOn(IpcChannel.InspectorClose, () => {
            this.stopListenTo();
        });
    }

    // [private methods]

    private startListenTo(listenToDataType: InspectorDataType): void {
        
        // duplicate listens to the same data, do nothing
        if (this._currentListenTo === listenToDataType) {
            return;
        }

        // clear the previous listeners
        this.stopListenTo();
        this._currentListenTo = listenToDataType;
        
        // send init data to the inspector for initial rendering
        this.__sendInitData(listenToDataType);

        // register listener for the later data changes
        this._lifecycle.register(this.__registerChangeListeners(listenToDataType));
    }

    private stopListenTo(): void {
        this._lifecycle.dispose();
        this._lifecycle = new DisposableManager();
        this._currentListenTo = undefined;
    }

    // [private methods]

    private __sendInitData(listenToDataType: InspectorDataType): void {
        const data = this.__transformData(listenToDataType);
        ipcRenderer.send(IpcChannel.InspectorDataSync, WIN_CONFIGURATION.windowID, data);
    }

    private __transformData(listenToDataType: InspectorDataType): InspectorData[] {
        if (listenToDataType === InspectorDataType.Configuration) {
            return transformConfigurationToData(this.configurationService.get(undefined));
        } 
        else if (listenToDataType === InspectorDataType.ContextKey) {
            return transformContextKeyToData(this.contextService.getAllContextKeys());
        }
        else if (listenToDataType === InspectorDataType.Command) {
            return transformCommandToData(this.commandRegistrant.getAllCommands());
        }
        else if (listenToDataType === InspectorDataType.Shortcut) {
            return transformShortcutToData(this.shortcutRegistrant.getAllShortcutRegistrations());
        }
        else if (listenToDataType === InspectorDataType.Color) {
            return transformColorToData(this.themeService.getCurrTheme());
        }
        else {
            return [];
        }
    }

    private __registerChangeListeners(listenToDataType: InspectorDataType): IDisposable {
        const listeners = new DisposableManager();

        // TODO: register -> listeners for the followup updates

        return listeners;
    }
}

function transformConfigurationToData(config: object): InspectorData[] {
    function buildData(obj: any): InspectorData[] {
        return Object.entries(obj).map(([key, value]) => {
            if (isObject(value)) {
                return { key, children: buildData(value), };
            } else {
                return { key, value, };
            }
        });
    }
    return buildData(config);
}

function transformContextKeyToData(contextKeys: readonly IContextKey<any>[]): InspectorData[] {
    const data: InspectorData[] = [];
    for (const contextKey of contextKeys) {
        data.push({
            key: contextKey.key,
            value: contextKey.get(),
        });
    }
    return data;
}

function transformCommandToData(commandMap: Map<string, ICommandBasicSchema>): InspectorData[] {
    const data: InspectorData[] = [];
    for (const [id, schema] of commandMap) {
        data.push({ key: id, });
    }
    return data;
}

function transformShortcutToData(shortcutMap: Map<HashNumber, IShortcutReference[]>): InspectorData[] {
    const data: InspectorData[] = [];
    for (const [shortcutHash, bindings] of shortcutMap) {
        const shortcut = Shortcut.fromHashcode(shortcutHash);
        data.push({
            key: shortcut.toString(),
            value: undefined,
            children: bindings.map(binding => ({
                key: binding.commandID,
                value: binding.when?.serialize() ?? null,
            }))
        });
    }
    return data;
}

function transformColorToData(theme: IColorTheme): InspectorData[] {
    const data: InspectorData[] = [];
    iterPropEnumerable(theme.getColorMap(), (propName, propValue: Color) => {
        data.push({
            key: propName,
            value: propValue.toString(),
        });
    });
    return data;
}