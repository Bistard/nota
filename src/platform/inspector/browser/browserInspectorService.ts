import { Color } from "src/base/common/color";
import { INSTANT_TIME, Time } from "src/base/common/date";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { InitProtector } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { Shortcut } from "src/base/common/keyboard";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { HashNumber } from "src/base/common/utilities/hash";
import { iterPropEnumerable } from "src/base/common/utilities/object";
import { isDefined, isObject } from "src/base/common/utilities/type";
import { ICommandBasicSchema, ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IContextKey } from "src/platform/context/common/contextKey";
import { IContextService } from "src/platform/context/common/contextService";
import { ipcRenderer, safeIpcRendererOn, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { IBrowserInspectorService, InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMenuItemRegistration, IMenuRegistrant, MenuTypes } from "src/platform/menu/common/menuRegistrant";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IShortcutReference, IShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import { IColorTheme } from "src/workbench/services/theme/colorTheme";
import { IThemeService } from "src/workbench/services/theme/themeService";

export class BrowserInspectorService implements IBrowserInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly commandRegistrant: ICommandRegistrant;
    private readonly shortcutRegistrant: IShortcutRegistrant;
    private readonly menuRegistrant: IMenuRegistrant;

    private readonly _initProtector: InitProtector;
    private _currentListenTo?: InspectorDataType;
    private _lifecycle: DisposableManager;
    private readonly _syncScheduler: UnbufferedScheduler<InspectorDataType>;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IContextService private readonly contextService: IContextService,
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @IThemeService private readonly themeService: IThemeService,
    ) {
        this.commandRegistrant = this.registrantService.getRegistrant(RegistrantType.Command);
        this.shortcutRegistrant = this.registrantService.getRegistrant(RegistrantType.Shortcut);
        this.menuRegistrant = this.registrantService.getRegistrant(RegistrantType.Menu);
        this._lifecycle = new DisposableManager();
        this._initProtector = new InitProtector();
        this._syncScheduler = new UnbufferedScheduler(Time.ms(500), listenToDataType => {
            const data = this.__transformData(listenToDataType);
            ipcRenderer.send(IpcChannel.InspectorDataSync, WIN_CONFIGURATION.windowID, data);
        });
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

    public isListening(): boolean {
        return isDefined(this._currentListenTo);
    }

    public startListenTo(listenToDataType: InspectorDataType): void {
        
        // duplicate listens to the same data, do nothing
        if (this._currentListenTo === listenToDataType) {
            return;
        }

        // clear the previous listeners
        this.stopListenTo();
        this._currentListenTo = listenToDataType;
        
        // send init data to the inspector for initial rendering
        this._syncScheduler.schedule(listenToDataType, INSTANT_TIME);

        // register listener for the later data changes
        this._lifecycle.register(this.__registerChangeListeners(listenToDataType));
    }

    public stopListenTo(): void {
        this._lifecycle.dispose();
        this._lifecycle = new DisposableManager();
        this._currentListenTo = undefined;
    }

    // [private methods]

    private __transformData(listenToDataType: InspectorDataType): InspectorData[] {
        switch (listenToDataType) {
            case InspectorDataType.Configuration:
                return transformConfigurationToData(this.configurationService.get(undefined));
            case InspectorDataType.ContextKey:
                return transformContextKeyToData(this.contextService.getAllContextKeys());
            case InspectorDataType.Command:
                return transformCommandToData(this.commandRegistrant.getAllCommands());
            case InspectorDataType.Shortcut:
                return transformShortcutToData(this.shortcutRegistrant.getAllShortcutRegistrations());
            case InspectorDataType.Color:
                return transformColorToData(this.themeService.getCurrTheme());
            case InspectorDataType.Menu:
                return transformMenuToData(this.menuRegistrant, this.menuRegistrant.getAllMenus(), false);
            default:
                return [];
        }
    }

    private __registerChangeListeners(listenToDataType: InspectorDataType): IDisposable {
        const listeners = new DisposableManager();
        const schedule = () => this._syncScheduler.schedule(listenToDataType);
        switch (listenToDataType) {
            case InspectorDataType.Configuration:
                listeners.register(this.configurationService.onDidConfigurationChange(schedule));
                break;
            case InspectorDataType.ContextKey:
                listeners.register(this.contextService.onDidContextChange(schedule));
                break;
            case InspectorDataType.Command:
                listeners.register(Event.any([this.commandRegistrant.onDidRegister, this.commandRegistrant.onDidUnRegister])(schedule));
                break;
            case InspectorDataType.Shortcut:
                listeners.register(Event.any([this.shortcutRegistrant.onDidRegister, this.shortcutRegistrant.onDidUnRegister])(schedule));
                break;
            case InspectorDataType.Color:
                listeners.register(this.themeService.onDidChangeTheme(schedule));
                break;
            case InspectorDataType.Menu:
                listeners.register(this.menuRegistrant.onDidMenuChange(schedule));
                break;
            default:
                break;
        }
        return listeners;
    }
}

function transformConfigurationToData(config: object): InspectorData[] {
    function buildData(obj: any, currentPath: string = ''): InspectorData[] {
        return Object.entries(obj).map(([key, value]) => {
            const fullPath = currentPath ? `${currentPath}.${key}` : key;
            if (isObject(value)) {
                return <InspectorData>{ key, children: buildData(value, fullPath) };
            } else {
                return <InspectorData>{ key, value, isEditable: true, id: fullPath };
            }
        });
    }
    return buildData(config, '');
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
            isColor: true,
        });
    });
    return data;
}

function transformMenuToData(
    menuRegistrant: IMenuRegistrant,
    menus: [MenuTypes, IMenuItemRegistration[]][],
    collapsedByDefault: boolean
): InspectorData[] {
    const data: InspectorData[] = [];

    for (const [menuType, registrations] of menus) {
        const children: InspectorData[] = registrations.map(registration => {
            let submenu = registration.submenu 
                && transformMenuToData(
                    menuRegistrant, 
                    [[registration.submenu, menuRegistrant.getMenuitems(registration.submenu)]], 
                    true,
                );

            return {
                key: registration.title,
                value: registration.command.commandID,
                children: submenu,
                collapsedByDefault: true,
            };
        });

        data.push({
            key: menuType,
            children: children,
            collapsedByDefault: collapsedByDefault,
        });
    }

    return data;
}
