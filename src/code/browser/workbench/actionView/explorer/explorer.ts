import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { Emitter, Register } from 'src/base/common/event';
import { INotebookGroupService } from 'src/code/platform/notebook/electron/notebookGroup';
import { IComponentService } from 'src/code/browser/service/componentService';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/section';
import { registerSingleton } from 'src/code/platform/instantiation/common/serviceCollection';
import { ServiceDescriptor } from 'src/code/platform/instantiation/common/descriptor';
import { addDisposableListener, EventType } from 'src/base/common/dom';
import { IEditorService } from 'src/code/browser/workbench/workspace/editor/editor';
import { IConfigService } from 'src/code/platform/configuration/common/abstractConfigService';
import { BuiltInConfigScope } from 'src/code/platform/configuration/common/configRegistrant';
import { IBrowserDialogService, IDialogService } from 'src/code/platform/dialog/browser/browserDialogService';

export const IExplorerViewService = createDecorator<IExplorerViewService>('explorer-view-service');

/**
 * An interface only for {@link ExplorerViewComponent}.
 */
export interface IExplorerViewService extends IComponent {
    
    /**
     * Fired when the directory is opened.
     */
    onDidOpenDirectory: Register<IExplorerDirectoryEvent>;

    /**
     * @description Validate the `.nota` directory and try to open the notebook 
     * directory by the given path. If repoen sets to true, it will reopen the 
     * current opeend notebook directory.
     * @param path The path waiting for opening.
     * @param reopen If requires reopen a new directory.
     * 
     * @returns If the explorer is opened or not.
     */
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

    // [event]

    private readonly _onDidOpenDirectory = this.__register(new Emitter<IExplorerDirectoryEvent>());
    public readonly onDidOpenDirectory = this._onDidOpenDirectory.registerListener;

    // [constructor]

    constructor(parentElement: HTMLElement,
                @IComponentService componentService: IComponentService,
                @IConfigService private readonly configService: IConfigService,
                @IDialogService private readonly dialogService: IBrowserDialogService,
                @Ii18nService private readonly i18nService: Ii18nService,
                @INotebookGroupService private readonly notebookGroupService: INotebookGroupService,
                @IEditorService private readonly editorService: IEditorService,
    ) {
        super(ComponentType.ExplorerView, parentElement, componentService);
    }

    // [protected overrdie method]

    protected override _createContent(): void {

        this._openedView = document.createElement('div');
        this._openedView.className = 'opened-explorer-container';

        this._unopenedView = document.createElement('div');
        this._unopenedView.className = 'unopened-explorer-container';
        
        const tag = document.createElement('div');
        tag.className = 'explorer-open-tag';        
        tag.textContent = this.i18nService.trans(Section.Explorer, 'openDirectory');
        tag.classList.add('vertical-center', 'funcText');
        this._unopenedView.appendChild(tag);

        const prevOpened = this.configService.get<string>(BuiltInConfigScope.User, 'workspace.notebook.previousOpenedDirctory');
        if (prevOpened) {
            // this.__createOpenedExplorerView(prevOpened, this._globalConfig.defaultConfigOn, false);
        } else {
            this.__createUnopenedExplorerView();
        }
    }

    protected override _registerListeners(): void {

        /**
         * Registers open directory dialog listener.
         */
        const tag = this._unopenedView.children[0]!; // REVIEW: set as class field
        this.__register(addDisposableListener(tag, EventType.click, () => {
            // this.ipcService.openDirectoryDialog(this._globalConfig.previousNotebookManagerDir);
        }));

        /**
         * once the directory dialog chosed a path to open, we get the message 
         * and open it.
         */
        this.dialogService.openDirectoryDialog({ title: 'open a directory' }).then(path => {
            this.__createOpenedExplorerView(path[0]!, false);            
        });

        /**
         * Opens in the editor.
         */
        this.__register(this.notebookGroupService.onOpen(e => {
            this.editorService.openEditor(e.item.uri);
        }));
    }

    // [public method]

    public async openDirectory(path: string, reopen: boolean): Promise<boolean> {
        // await this.__createOpenedExplorerView(path, this._globalConfig.defaultConfigOn, reopen);
        return this._opened;
    }

    // [private helper method]

    /**
     * @description Apeend the HTML container to the DOM tree and try to remove
     * the opened container.
     */
    private __createUnopenedExplorerView(): void {
        
        // prevent double append
        if (!this._opened && this.container.hasChildNodes()) {
            return;
        }

        this.__destroyOpenedExplorerView();

        this.container.appendChild(this._unopenedView);
        this._opened = false;
    }

    /**
     * @description Removes the HTML container from the DOM tree to achieve 
     * `destroy`.
     */
    private __destroyUnopenedExplorerView(): void {
        if (!this._opened && this.container.hasChildNodes()) {
            this.container.removeChild(this._unopenedView);
        }
    }

    /**
     * @description Firstly will validate the `.nota` directory and try to 
     * update the local user configuration. Secondly will open the previous 
     * opened directory.
     * @param path The path waiting for opening.
     * @param reopen If requires reopen a new directory.
     */
    private async __createOpenedExplorerView(path: string, reopen: boolean): Promise<void> {
        
        if (this._opened && reopen === false)  {
            return;
        }

        if (this._opened && reopen) {
            this.__destroyOpenedExplorerView();
            this._opened = false;
        }

        // check `.nota` folder and try to update the local user configuration
        // await this.userConfigService.validateLocalUserDirectory(path, defaultConfigOn);
        
        this.__destroyUnopenedExplorerView();

        // open the directory under the notebook manager
        try {
            await this.notebookGroupService.open(this._openedView, path);
        } catch (err) {
            // logService.trace(err);
        }

        this.container.appendChild(this._openedView);
        
        /**
         * Since the `this._openedView` is added into the DOM tree, we now can
         * re-layout to calcualte the correct size of the view.
         */
        this.notebookGroupService.layout();

        this._opened = true;
        this._onDidOpenDirectory.fire({ path: path });
    }

    /**
     * @description Removes the HTML container from the DOM tree to achieve 
     * `destroy`.
     */
    private __destroyOpenedExplorerView(): void {
        if (this._opened) {
            this.container.removeChild(this._openedView);
        }
    }

}

registerSingleton(IExplorerViewService, new ServiceDescriptor(ExplorerViewComponent));