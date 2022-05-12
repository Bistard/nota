import { FileNode } from 'src/base/node/fileTree';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/electron/register';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { DomEmitter, Emitter, EVENT_EMITTER, Register } from 'src/base/common/event';
import { INoteBookManagerService } from 'src/code/common/model/notebookManager';
import { IComponentService } from 'src/code/browser/service/componentService';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/section';
import { registerSingleton } from 'src/code/common/service/instantiationService/serviceCollection';
import { ServiceDescriptor } from 'src/code/common/service/instantiationService/descriptor';
import { IpcCommand } from 'src/base/electron/ipcCommand';
import { EGlobalSettings, EUserSettings, IGlobalConfigService, IGlobalNotebookManagerSettings, IUserConfigService, IUserNotebookManagerSettings } from 'src/code/common/service/configService/configService';
import { IIpcService, IpcService } from 'src/code/browser/service/ipcService';
import { EventType } from 'src/base/common/dom';

export const IExplorerViewService = createDecorator<IExplorerViewService>('explorer-view-service');

/**
 * An interface only for {@link ExplorerViewComponent}.
 */
export interface IExplorerViewService extends IComponent {
    
    /**
     * Fired when the directory is opened.
     */
    onDidOpenDirectory: Register<IExplorerDirectoryEvent>;

    openDirectory(path: string, reopen: boolean): Promise<boolean>;
}

export interface IExplorerDirectoryEvent {

    /**
     * The path of the directory in string form.
     */
    path: string;

}

/**
 * @class TODO: complete comments
 */
export class ExplorerViewComponent extends Component implements IExplorerViewService {

    // [field]

    private _openedView!: HTMLElement;
    private _unopenedView!: HTMLElement;

    /** If the explorer is currently opened. */
    private _opened = false;

    /** restores the configuration in the class itself. */
    private _globalConfig!: IGlobalNotebookManagerSettings;
    private _userConfig!: IUserNotebookManagerSettings;

    // [event]

    private _onDidOpenDirectory = this.__register(new Emitter<IExplorerDirectoryEvent>());
    public onDidOpenDirectory = this._onDidOpenDirectory.registerListener;

    // [constructor]

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @IIpcService private readonly ipcService: IpcService,
                @Ii18nService private readonly i18nService: Ii18nService,
                @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
                @IUserConfigService private readonly userConfigService: IUserConfigService,
                @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ExplorerView, parentComponent, parentElement, componentService);

        this.__getAllConfiguration();
    }

    // [protected overrdie method]

    protected override _createContent(): void {

        this._openedView = document.createElement('div');
        this._openedView.className = 'opened-explorer-container';

        this._unopenedView = document.createElement('div');
        this._unopenedView.className = 'unopened-explorer-container';
        
        const tag = document.createElement('div');
        tag.className = 'explorer-open-tag';        
        tag.innerHTML = this.i18nService.trans(Section.Explorer, 'openDirectory');
        tag.classList.add('vertical-center', 'funcText');
        this._unopenedView.appendChild(tag);

        if (this._globalConfig.startPreviousNoteBookManagerDir) {
            this.__createOpenedExplorerView(this._globalConfig.previousNoteBookManagerDir, this._globalConfig.defaultConfigOn, false);

        } else {
            this.__createUnopenedExplorerView();
        }
        
    }

    protected override _registerListeners(): void {

        /**
         * @readonly register context menu listeners (right click menu)
        */
        this.container.addEventListener('contextmenu', (ev: MouseEvent) => {
                ev.preventDefault();
                this.contextMenuService.removeContextMenu();
                let coordinate: Coordinate = {
                    coordinateX: ev.pageX,
                    coordinateY: ev.pageY,
                };

                this.contextMenuService.createContextMenu(ContextMenuType.explorerView, coordinate);
        });

        /**
         * Registers open directory dialog listener.
         */
        const tag = this._unopenedView.children[0]!;
        this.__register(new DomEmitter(tag, EventType.click)).registerListener(() => {
            this.ipcService.openDirectoryDialog(this._globalConfig.previousNoteBookManagerDir);
        });

        /**
         * once the directory dialog chosed a path to open, we get the message 
         * and open it.
         */
        this.__register(this.ipcService.onDidOpenDirectoryDialog((path) => {
            this.__createOpenedExplorerView(path, this._globalConfig.defaultConfigOn, false);
        }));
    }

    // [method]

    public async openDirectory(path: string, reopen: boolean): Promise<boolean> {
        await this.__createOpenedExplorerView(path, this._globalConfig.defaultConfigOn, reopen);
        return this._opened;
    }

    // [private helper method]

    /**
     * @description Will sets up global configurations and user configurations 
     * into class itself.
     * @note Will only be invoked in the constrcutor.
     */
     private __getAllConfiguration(): void {
        
        // get configurations and save it in the class itself.
        try {
            this._globalConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
            this._userConfig = this.userConfigService.get<IUserNotebookManagerSettings>(EUserSettings.NotebookManager);
        } catch (err) {
            throw new Error(`Explorer: ${err}`);
        }

        // update configurations when changed.

        this.globalConfigService.onDidChangeNotebookManagerSettings((newConfig) => {
            this._globalConfig = newConfig;
        });

        this.userConfigService.onDidChangeNotebookManagerSettings((newConfig) => {
            this._userConfig = newConfig;
        });
    }

    /**
     * @description
     */
    private __createUnopenedExplorerView(): void {
        
        // prevent double append
        if (this.container.hasChildNodes()) {
            return;
        }

        if (this._opened) {
            this.__destroyOpenedExplorerView();
        }

        this.container.appendChild(this._unopenedView);
        this._opened = false;
    }

    /**
     * 
     */
    private __destroyUnopenedExplorerView(): void {
        if (this._opened === false && this.container.hasChildNodes()) {
            this.container.removeChild(this._unopenedView);
        }
    }

    /**
     * @description Firstly will validate the `.nota` directory and try to 
     * update the local user configuration. Secondly will open the previous 
     * opened directory.
     * @param path The path waiting for opening.
     * @param defaultConfigOn If we are using the default user configuration.
     * @param reopen If requires reopen a new directory.
     */
    private async __createOpenedExplorerView(path: string, defaultConfigOn: boolean, reopen: boolean): Promise<void> {
        
        if (this._opened && reopen === false)  {
            return;
        }

        if (this._opened && reopen) {
            this.__destroyOpenedExplorerView();
            this._opened = false;
        }

        // check `.nota` folder and try to update the local user configuration
        await this.userConfigService.validateLocalUserDirectory(path, defaultConfigOn);
        
        this.__destroyUnopenedExplorerView();

        // open the directory under the notebook manager
        await this.noteBookManagerService.open(this._openedView, path);

        this.container.appendChild(this._openedView);
        this._opened = true;
    }

    /**
     * @description
     */
    private __destroyOpenedExplorerView(): void {
        if (this._opened) {
            this.container.removeChild(this._openedView);
        }
        // TODO
    }

}

registerSingleton(IExplorerViewService, new ServiceDescriptor(ExplorerViewComponent));