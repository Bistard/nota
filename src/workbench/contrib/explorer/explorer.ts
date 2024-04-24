import 'src/workbench/contrib/explorer/media/explorerItem.scss';
import 'src/workbench/contrib/explorer/media/explorerView.scss';
import { Emitter } from 'src/base/common/event';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { II18nService } from 'src/platform/i18n/common/i18n';
import { Section } from 'src/platform/section';
import { addDisposableListener, EventType, Orientation } from 'src/base/browser/basic/dom';
import { IBrowserDialogService, IDialogService } from 'src/platform/dialog/browser/browserDialogService';
import { ILogService } from 'src/base/common/logger';
import { IWorkbenchService } from 'src/workbench/services/workbench/workbenchService';
import { IBrowserLifecycleService, ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { IBrowserEnvironmentService } from 'src/platform/environment/common/environment';
import { URI } from 'src/base/common/files/uri';
import { IHostService } from 'src/platform/host/common/hostService';
import { StatusKey } from 'src/platform/status/common/status';
import { DisposableManager } from 'src/base/common/dispose';
import { Icons } from 'src/base/browser/icon/icons';
import { NavView } from 'src/workbench/parts/navigationPanel/navigationView/navigationView';
import { VisibilityController } from 'src/base/browser/basic/visibilityController';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Button } from 'src/base/browser/basic/button/button';
import { IFileOpenEvent, ExplorerViewID, IExplorerViewService } from 'src/workbench/contrib/explorer/explorerService';
import { IEditorService } from 'src/workbench/parts/workspace/editor/editorService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IFileTreeService } from 'src/workbench/services/fileTree/treeService';

/**
 * @class Represents an Explorer view within a workbench, providing a UI 
 * component to navigate and manage the file system hierarchy. 
 * 
 * The view includes functionality such as opening files and directories, 
 * displaying the current directory's contents, and integrating with other 
 * services like the editor and theme services to enhance the user experience.
 * 
 * This class extends `NavigationView`, allowing it to be used as a side panel
 * within the application's layout.
 */
export class ExplorerView extends NavView implements IExplorerViewService {

    // [field]

    /**
     * Since the switching between opened / unopened views is not often thus we 
     * do not need to hold each view in the memory.
     */
    private _currentView?: HTMLElement;

    /**
     * A disposable that contains all the UI related listeners of the current 
     * view.
     */
    private _currentListeners = new DisposableManager();
    private readonly _navigationbar = new NavigationBar();

    // [event]

    private readonly _onDidOpen = this.__register(new Emitter<IFileOpenEvent>());
    public readonly onDidOpen = this._onDidOpen.registerListener;

    // [constructor]

    constructor(
        parentElement: HTMLElement,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @IDialogService private readonly dialogService: IBrowserDialogService,
        @II18nService private readonly i18nService: II18nService,
        @IEditorService private readonly editorService: IEditorService,
        @ILogService logService: ILogService,
        @IWorkbenchService private readonly workbenchService: IWorkbenchService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IHostService private readonly hostService: IHostService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileTreeService private readonly fileTreeService: IFileTreeService,
    ) {
        super(ExplorerViewID, parentElement, themeService, componentService, logService);

        lifecycleService.onWillQuit(e => e.join(this.__onApplicationClose()));
    }

    // [getter]

    get isOpened(): boolean {
        return this.fileTreeService.isOpened;
    }

    get root(): URI | undefined {
        return this.fileTreeService.root;
    }

    // [public method]

    public async open(root: URI): Promise<void> {

        if (this.fileTreeService.isOpened) {
            this.logService.warn('ExplorerView', `view is already opened at: ${URI.toString(this.fileTreeService.root!, true)}`);
            return;
        }

        // unload the current view first
        this.__unloadCurrentView();

        // try to open the view at the given root
        const [view, success] = await this.__tryOpen(root);

        // load the given view as the current view
        this.__loadCurrentView(view, !success);

        /**
         * Once the element is put into the DOM tree, we now can relayout to 
         * calculate the correct size of the view.
         */
        this.fileTreeService.layout();
    }

    public async close(): Promise<void> {
        if (!this.isOpened) {
            return;
        }

        await this.fileTreeService.close();

        this.__unloadCurrentView();
        const emptyView = this.__createEmptyView();
        this.__loadCurrentView(emptyView, true);
    }

    // [protected override method]

    protected override _createContent(): void {
        /**
         * If there are waiting URIs to be opened, we will open it once we are 
         * creating the UI component.
         */
        const uriToOpen = this.environmentService.configuration.uriOpenConfiguration;
        if (uriToOpen.directory) {
            this.open(uriToOpen.directory);
        }
        // we simply put an empty view
        else {
            const emptyView = this.__createEmptyView();
            this.__loadCurrentView(emptyView, true);
        }
    }

    protected override _registerListeners(): void {
        super._registerListeners();

        /**
         * No need to register listeners initially, since `__loadCurrentView` 
         * will do for us internally.
         */
    }

    // [private helper method]

    private async __onApplicationClose(): Promise<void> {

        // save the last opened workspace root path.
        const openedWorkspace = this.fileTreeService.root 
            ? URI.toString(URI.join(this.fileTreeService.root, '|directory'))
            : '';
        await this.hostService.setApplicationStatus(StatusKey.LastOpenedWorkspace, openedWorkspace);
    }

    private __unloadCurrentView(): void {
        if (this._currentView) {
            this._currentView.remove();
            this._currentView = undefined;
            this._currentListeners.dispose();
        }
    }

    private __loadCurrentView(view: HTMLElement, isEmpty: boolean): void {
        if (!this._currentView) {
            this._currentView = view;
            this.element.appendChild(view);
            this._currentListeners = new DisposableManager();

            if (isEmpty) {
                this.__registerEmptyViewListeners();
            } else {
                this.__registerNonEmptyViewListeners(view);
            }
        }
    }

    /**
     * @description Try to open the explorer tree view at the given path.
     * @param path The given path.
     * @returns Returns a new {@link HTMLElement} of the view and a boolean 
     * indicates if operation succeeded.
     */
    private async __tryOpen(path: URI): Promise<[HTMLElement, boolean]> {
        let success = true;
        let container = this.__createOpenedView();

        /**
         * Open the root in the explorer tree service who will handle the 
         * complicated stuff for us.
         */
        const init = await this.fileTreeService.init(container, path);
        if (init.isOk()) {
            this._onDidOpen.fire({ path: path });
        } 
        
        /**
         * If the initialization fails, we capture it and replace it with an
         * empty view.
         */
        else {
            const error = init.error;
            success = false;
            container = this.__createEmptyView();
            this.logService.error('ExplorerView', `Cannot open the view`, error, { at: URI.toString(path, true) });
        }

        return [container, success];
    }

    // [private UI helper methods]

    private __createEmptyView(): HTMLElement {

        // the view
        const view = document.createElement('div');
        view.className = 'empty-explorer-container';

        // the tag
        const tag = document.createElement('div');
        tag.className = 'explorer-open-tag';
        tag.textContent = this.i18nService.trans(Section.Explorer, 'openDirectory');
        view.appendChild(tag);

        return view;
    }

    private __createOpenedView(): HTMLElement {
        // create view
        const view = document.createElement('div');
        view.className = 'opened-explorer-container';

        // renders navigationbar
        this._navigationbar.render(view);

        return view;
    }

    private __registerEmptyViewListeners(): void {
        if (this.isOpened || !this._currentView) {
            return;
        }

        const disposables = this._currentListeners;

        /**
         * Empty view opening directory dialog listener (only open the last 
         * selected one).
         */
        const emptyView = this._currentView;
        const tag = emptyView.children[0]!;
        disposables.register(addDisposableListener(tag, EventType.click, () => {
            this.dialogService.openDirectoryDialog({ title: 'open a directory' })
            .then(path => {
                if (path.length > 0) {
                    this.open(URI.fromFile(path.at(-1)!));
                }
            });
        }));
    }

    private __registerNonEmptyViewListeners(view: HTMLElement): void {
        if (!this.isOpened || !this._currentView) {
            return;
        }

        const disposables = this._currentListeners;

        /**
         * The tree model of the tree-service requires the correct height thus 
         * we need to update it every time we are resizing.
         */
        disposables.register(this.workbenchService.onDidLayout(() => this.fileTreeService.layout()));

        // on opening file.
        disposables.register(this.fileTreeService.onSelect(e => {
            this.editorService.openSource(e.item.uri);
        }));

        // Displays the utility buttons only when hovering the view.
        disposables.register(addDisposableListener(view, EventType.mouseover, () => this._navigationbar.show()));
        disposables.register(addDisposableListener(view, EventType.mouseout, () => this._navigationbar.hide()));
    }
}

export class NavigationBar {

    // [field]

    private readonly _element: HTMLElement;
    private readonly _visibilityController = new VisibilityController();
    private readonly _buttons: WidgetBar<Button>;

    // [constructor]

    constructor() {

        this._element = document.createElement('div');
        this._element.className = 'navigationbar';

        this._visibilityController.setDomNode(this._element);

        this._buttons = new WidgetBar(undefined, {
            orientation: Orientation.Horizontal,
            render: false,
        });
        [
            { id: 'create-new-note', icon: Icons.CreateNewNote, classes: [], fn: () => { } },
            { id: 'create-new-folder', icon: Icons.CreateNewFolder, classes: [], fn: () => { } },
            { id: 'collapse-all', icon: Icons.CollapseAll, classes: [], fn: () => { } },
        ]
            .forEach(({ id, icon, classes, fn }) => {
                const button = new Button({
                    icon: icon,
                    classes: classes,
                });

                button.onDidClick(fn);
                this._buttons.addItem({
                    id: id,
                    item: button,
                    dispose: button.dispose,
                });
            });
    }

    // [public methods]

    public render(parent: HTMLElement): void {

        this._visibilityController.setVisibility(false);

        // navigationbar container
        const navigationBarContainer = document.createElement('div');
        navigationBarContainer.className = 'navigationbar-container';
        this._buttons.render(navigationBarContainer);

        this._element.appendChild(navigationBarContainer);
        parent.appendChild(this._element);
    }

    public show(): void {
        this._visibilityController.setVisibility(true);
    }

    public hide(): void {
        this._visibilityController.setVisibility(false);
    }
}