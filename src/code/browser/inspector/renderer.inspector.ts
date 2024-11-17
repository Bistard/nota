import { Button } from "src/base/browser/basic/button/button";
import { addDisposableListener, EventType, Orientation, waitDomToBeLoad } from "src/base/browser/basic/dom";
import { IWidget } from "src/base/browser/basic/widget";
import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNode, ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Color } from "src/base/common/color";
import { ErrorHandler } from "src/base/common/error";
import { Event, monitorEventEmitterListenerGC } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { ILogService, BufferLogger, LogLevel } from "src/base/common/logger";
import { errorToMessage } from "src/base/common/utilities/panic";
import { isBoolean, isNullable, isNumber, isString, PrimitiveType, toBoolean } from "src/base/common/utilities/type";
import { initGlobalErrorHandler } from "src/code/browser/common/renderer.common";
import { BrowserConfigurationService } from "src/platform/configuration/browser/browserConfigurationService";
import { APP_CONFIG_NAME, ConfigurationModuleType, IConfigurationService } from "src/platform/configuration/common/configuration";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { initExposedElectronAPIs, ipcRenderer, safeIpcRendererOn, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { IBrowserEnvironmentService, ApplicationMode } from "src/platform/environment/common/environment";
import { BrowserFileChannel } from "src/platform/files/browser/fileChannel";
import { IFileService } from "src/platform/files/common/fileService";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { IpcService, IIpcService } from "src/platform/ipc/browser/ipcService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ProxyChannel } from "src/platform/ipc/common/proxy";
import { ReviverRegistrant } from "src/platform/ipc/common/revive";
import { BrowserLifecycleService, IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { ConsoleLogger } from "src/platform/logger/common/consoleLoggerService";
import { IRegistrantService, RegistrantService } from "src/platform/registrant/common/registrantService";

/**
 * InspectorRenderer first entry for inspector window.
 */
new class InspectorRenderer {
    
    // [fields]

    private readonly logService!: ILogService;

    // [constructor]

    constructor() {
        this.init();
    }
    
    // [public methods]

    public async init(): Promise<void> {

        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => console.error(error));

        let instantiationService: IInstantiationService | undefined;
        try {
            // retrieve the exposed APIs from preload.js
            initExposedElectronAPIs();
            monitorEventEmitterListenerGC({
                ListenerGCedWarning: toBoolean(WIN_CONFIGURATION.ListenerGCedWarning),
            });

            // ensure we handle almost every errors properly
            initGlobalErrorHandler(() => this.logService, WIN_CONFIGURATION, error => {
                const hostService = instantiationService!.getOrCreateService(IHostService);
                hostService.showMessageBox({
                    type: 'error',
                    title: 'Unexpected Error',
                    message: errorToMessage(error),
                    detail: '',
                    buttons: ['OK'],
                });
            });

            // core service construction
            instantiationService = this.createCoreServices();

            // service initialization
            await Promise.all([
                this.initServices(instantiationService),
                waitDomToBeLoad().then(() => this.logService?.info('renderer', 'Web environment (DOM content) has been loaded.')),
            ]);

            // view initialization
            const window = instantiationService.createInstance(InspectorWindow, document.body);

            // browser initialization
            const browser = instantiationService.createInstance(InspectorBrowser, window);
        }
        catch (error: any) {
            ErrorHandler.onUnexpectedError(error);
        }
    }

    // [private helper methods]

    private createCoreServices(): IInstantiationService {
        
        // instantiation-service (Dependency Injection)
        const instantiationService = new InstantiationService(new ServiceCollection());
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);
        (<any>this.logService) = logService;

        // environment-service
        const environmentService = new BrowserEnvironmentService(logService);
        instantiationService.register(IBrowserEnvironmentService, environmentService);
        
        // logger
        logService.setLogger(new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN));

        // registrant-service
        const registrantService = new RegistrantService(logService);
        instantiationService.register(IRegistrantService, registrantService);
        registrantService.registerRegistrant(instantiationService.createInstance(ConfigurationRegistrant));
        registrantService.registerRegistrant(instantiationService.createInstance(ReviverRegistrant));
        registrantService.init(instantiationService);

        // ipc-service
        const ipcService = new IpcService(environmentService.windowID, logService);
        instantiationService.register(IIpcService, ipcService);

        // host-service
        const hostService = ProxyChannel.unwrapChannel<IBrowserHostService>(ipcService.getChannel(IpcChannel.Host), { context: environmentService.windowID });
        instantiationService.register(IHostService, hostService);

        // lifecycle-service
        const lifecycleService = new BrowserLifecycleService(logService, hostService);
        instantiationService.register(ILifecycleService, lifecycleService);

        // file-service
        const fileService = instantiationService.createInstance(BrowserFileChannel);
        instantiationService.register(IFileService, fileService);

        // configuration-service
        const configurationService = instantiationService.createInstance(BrowserConfigurationService, { 
            appConfiguration: { path: URI.join(environmentService.appConfigurationPath, APP_CONFIG_NAME) } 
        });
        instantiationService.register(IConfigurationService, configurationService);

        return instantiationService;
    }

    private async initServices(instantiationService: IInstantiationService): Promise<any> {
        const configurationService = instantiationService.getService(IConfigurationService);
        await configurationService.init().unwrap();
    }
};

class InspectorBrowser {
    
    // [field]

    private readonly _view: InspectorWindow;

    // [constructor]

    constructor(
        view: InspectorWindow,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IHostService private readonly hostService: IHostService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        this._view = view;
        this.registerListeners();
        this.hostService.setWindowAsRendererReady();
    }

    // [public methods]

    private registerListeners(): void {
        // listener: before quit, notify the main process we are actually closing
        this.lifecycleService.onWillQuit(e => {
            ipcRenderer.send(IpcChannel.InspectorClose, WIN_CONFIGURATION.windowID);
        });

        // listener: update view for incoming data
        safeIpcRendererOn(IpcChannel.InspectorDataSync, (e, data: InspectorData[]) => {
            this._view.onData(data);
        });

        // auto re-layout
        {
            addDisposableListener(window, EventType.resize, () => {
                this._view.layout();
            });
            const anyEvents = Event.any([
                this.hostService.onDidEnterFullScreenWindow,
                this.hostService.onDidLeaveFullScreenWindow,
                this.hostService.onDidMaximizeWindow,
                this.hostService.onDidUnMaximizeWindow,
            ]);
            anyEvents(windowID => {
                if (windowID === this.environmentService.windowID) {
                    this._view.layout();
                }
            });
        }
    }
}

class InspectorWindow {
    
    // [field]

    private readonly _parent: HTMLElement;
    private readonly _navBar: WidgetBar<IWidget>;
    private readonly _inspectorViewContainer: HTMLElement;
    private _tree?: InspectorTree;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        this._parent = parent;

        const viewContainer = document.createElement('div');
        viewContainer.className = 'inspector-view-container';

        this._navBar = this.__buildNavigationBar(viewContainer);
        this._inspectorViewContainer = this.__buildInspectorView(viewContainer);

        parent.appendChild(viewContainer);
    }

    // [public methods]

    public onData(data: InspectorData[]): void {
        if (this._tree) {
            this._tree.dispose();
            this._tree = undefined;
        }
        
        const initTree = transformDataToTree(data);
        this._tree = new InspectorTree(this._inspectorViewContainer, initTree, this.configurationService);
    }

    public layout(): void {
        this._tree?.layout();
    }

    // [private methods]

    private __buildNavigationBar(parent: HTMLElement): WidgetBar<IWidget> {
        const navBar = new WidgetBar('inspector-bar', { orientation: Orientation.Horizontal, parentContainer: parent });

        const navigation = [
            { type: InspectorDataType.Configuration },
            { type: InspectorDataType.ContextKey },
            { type: InspectorDataType.Command },
            { type: InspectorDataType.Shortcut },
            { type: InspectorDataType.Color },
            { type: InspectorDataType.Menu },
        ];

        let currButton: Button | undefined = undefined;
        
        for (const { type } of navigation) {
            const button = new Button({ id: type, label: type });
            navBar.addItem({
                id: type,
                data: button,
                dispose: button.dispose.bind(button),
            });
            button.onDidClick(() => {
                if (currButton) {
                    currButton.element.classList.toggle('focused');
                }
                currButton = button;
                button.element.classList.toggle('focused');
                this.__beginListening(type);
            });
        }
        
        navBar.render();
        return navBar;
    }

    private __beginListening(listenToType: InspectorDataType): void {
        ipcRenderer.send(IpcChannel.InspectorReady, WIN_CONFIGURATION.windowID, listenToType);
    }

    private __buildInspectorView(parent: HTMLElement): HTMLElement {
        const inspectorView = document.createElement('div');
        inspectorView.className = 'inspector-view';
        
        parent.appendChild(inspectorView);
        return inspectorView;
    }
}

class InspectorTree extends MultiTree<InspectorItem, void> {

    public readonly rootItem: InspectorItem;

    constructor(
        container: HTMLElement,
        initData: ITreeNodeItem<InspectorItem>[],
        configurationService: IConfigurationService,
    ) {
        const rootItem = new InspectorItem('$_root_', undefined, 'object');
        super(
            container,
            rootItem,
            [new InspectorItemRenderer(configurationService)],
            new InspectorItemProvider(),
            {
                collapsedByDefault: false,
                transformOptimization: true,
                identityProvider: {
                    getID: configName => configName.key,
                },
            }
        );
        this.rootItem = rootItem;

        this.splice(this.rootItem, initData);
        this.layout();
    }
}

class InspectorItem {
    constructor(
        public readonly key: string,
        public readonly value: PrimitiveType | undefined,
        public readonly id?: string,
        public readonly isColor?: true,
        public readonly isEditable?: true,
    ) {}
}

function transformDataToTree(data: InspectorData[]): ITreeNodeItem<InspectorItem>[] {
    function buildTree(data: InspectorData[]): ITreeNodeItem<InspectorItem>[] {
        return data.map(item => {
            const node: ITreeNodeItem<InspectorItem> = {
                data: new InspectorItem(item.key, item.value, item.id, item.isColor, item.isEditable),
                collapsible: !!item.children,
                children: item.children ? buildTree(item.children) : undefined,
            };
            return node;
        });
    }
    return buildTree(data);
}

interface IInspectorItemMetadata extends IListViewMetadata {
    readonly keyElement: HTMLElement;
    readonly valueElement: HTMLInputElement;
}
const InspectorRendererType = 'inspector-renderer';

class InspectorItemRenderer implements ITreeListRenderer<InspectorItem, FuzzyScore, IInspectorItemMetadata> {

    public readonly type: RendererType = InspectorRendererType;

    constructor(
        private readonly configurationService: IConfigurationService,
    ) {}

    public render(element: HTMLElement): IInspectorItemMetadata {
        // key part
        const key = document.createElement('span');
        key.className = 'inspector-item-key';
        key.style.lineHeight = `${InspectorItemProvider.Size - 4}px`;
        element.appendChild(key);

        // value part
        const value = document.createElement('input');
        value.className = 'inspector-item-value';
        value.style.lineHeight = `${InspectorItemProvider.Size - 4}px`;
        element.appendChild(value);

        return {
            container: element,
            keyElement: key,
            valueElement: value,
        };
    }

    public update(item: ITreeNode<InspectorItem, void>, index: number, metadata: IInspectorItemMetadata, size?: number): void {
        const data = item.data;

        if (item.depth === 1) {
            metadata.container.parentElement?.parentElement?.classList.add('top-level');
        }

        const keyPart = metadata.keyElement;
        keyPart.textContent = data.key;
        const valuePart = metadata.valueElement;
        let textContent = data.value === undefined ? '' : String(data.value);

        if (data.value === undefined) {
            valuePart.disabled = true;
            valuePart.classList.add('disabled');
        } 
        else if (!data.isEditable) {
            valuePart.readOnly = true;
            valuePart.classList.add('disabled');
        }
        // editable
        else {
            valuePart.addEventListener('change', e => {
                const raw = valuePart.value;
                const rawLower = raw.toLowerCase();
                let value: any;
                // string
                if (raw.startsWith('"') && raw.endsWith('"')) {
                    value = raw.slice(1, -1);
                }
                // boolean
                else if (rawLower === 'true' || rawLower === 'false') {
                    value = rawLower === 'true';
                }
                // number
                else if (isNaN(parseInt(raw)) === false) {
                    value = parseInt(raw);
                }
                // null
                else if (raw === 'null') {
                    value = null;
                }
                // array
                else if (raw.startsWith('[') && raw.endsWith(']')) {
                    value = JSON.parse(raw);
                }
                // unexpected
                else {
                    value = raw;
                }
                this.configurationService.set(data.id!, value, { type: ConfigurationModuleType.User });
                e.stopPropagation();
            });
        }

        // color data
        if (data.isColor) {
            textContent = textContent.toUpperCase();
            valuePart.style.backgroundColor = `${textContent}`;
            valuePart.style.color = Color.parseHex(textContent).isDarker() ? 'white' : 'black'; // create contrast text color
        }
        // general case
        else if (isNumber(data.value)) {
            valuePart.style.color = `#a1f7b5`; // light green
        }
        else if (isString(data.value)) {
            valuePart.style.color = '#f28b54';
            textContent = `"${textContent}"`; // orange
        }
        else if (isBoolean(data.value) || isNullable(data.value)) {
            valuePart.style.color = '#9980ff'; // purple
        }
        else if (Array.isArray(data.value)) {
            textContent = `[${textContent}]`; // array
        }

        valuePart.defaultValue = textContent;
    }

    public updateIndent(item: ITreeNode<InspectorItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.ArrowRight));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.ArrowRight));
        }
    }

    public dispose(data: IInspectorItemMetadata): void {
        // Dispose logic can be added here if necessary
    }
}

class InspectorItemProvider implements IListItemProvider<InspectorItem> {

    /**
     * The height in pixels for every outline item.
     */
    public static readonly Size = 24;

    public getSize(data: InspectorItem): number {
        return InspectorItemProvider.Size;
    }

    public getType(data: InspectorItem): RendererType {
        return InspectorRendererType;
    }
}
