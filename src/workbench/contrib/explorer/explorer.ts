import 'src/workbench/contrib/explorer/media/explorerItem.scss';
import 'src/workbench/contrib/explorer/media/explorerView.scss';
import { Emitter } from 'src/base/common/event';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { Ii18nService } from 'src/platform/i18n/common/i18n';
import { Section } from 'src/platform/section';
import { addDisposableListener, EventType, Orientation } from 'src/base/browser/basic/dom';
import { IBrowserDialogService, IDialogService } from 'src/platform/dialog/browser/browserDialogService';
import { ILogService } from 'src/base/common/logger';
import { IWorkbenchService } from 'src/workbench/services/workbench/workbenchService';
import { IBrowserLifecycleService, ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { IBrowserEnvironmentService } from 'src/platform/environment/common/environment';
import { IExplorerTreeService } from 'src/workbench/services/explorerTree/explorerTreeService';
import { URI } from 'src/base/common/file/uri';
import { IHostService } from 'src/platform/host/common/hostService';
import { StatusKey } from 'src/platform/status/common/status';
import { DisposableManager } from 'src/base/common/dispose';
import { createIcon } from 'src/base/browser/icon/iconRegistry';
import { Icons } from 'src/base/browser/icon/icons';
import { SideViewTitlePart } from 'src/workbench/parts/sideView/sideViewTitle';
import { SideView } from 'src/workbench/parts/sideView/sideView';
import { VisibilityController } from 'src/base/browser/basic/visibilityController';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Button } from 'src/base/browser/basic/button/button';
import { RGBA } from 'src/base/common/color';
import { ClassicOpenEvent, ExplorerViewID, IExplorerViewService } from 'src/workbench/contrib/explorer/explorerService';
import { IEditorService } from 'src/workbench/parts/workspace/editor/editorService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { errorToMessage } from 'src/base/common/error';

/**
 * @class TODO: complete comments
 */
export class ExplorerView extends SideView implements IExplorerViewService {

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

    private readonly _toolbar = new Toolbar();

    // [event]

    private readonly _onDidOpen = this.__register(new Emitter<ClassicOpenEvent>());
    public readonly onDidOpen = this._onDidOpen.registerListener;

    // [constructor]

    constructor(
        parentElement: HTMLElement,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @IDialogService private readonly dialogService: IBrowserDialogService,
        @Ii18nService private readonly i18nService: Ii18nService,
        @IEditorService private readonly editorService: IEditorService,
        @ILogService private readonly logService: ILogService,
        @IWorkbenchService private readonly workbenchService: IWorkbenchService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IHostService private readonly hostService: IHostService,
        @IBrowserEnvironmentService private readonly envrionmentService: IBrowserEnvironmentService,
        @IExplorerTreeService private readonly explorerTreeService: IExplorerTreeService,
    ) {
        super(ExplorerViewID, parentElement, themeService, componentService);

        lifecycleService.onWillQuit(e => e.join(this.__onApplicationClose()));
    }

    // [getter]

    get isOpened(): boolean {
        return this.explorerTreeService.isOpened;
    }

    get root(): URI | undefined {
        return this.explorerTreeService.root;
    }

    // [public method]

    public async open(root: URI): Promise<void> {

        if (this.explorerTreeService.isOpened) {
            this.logService.warn(`[ExplorerView] view is already opened at '${URI.toString(this.explorerTreeService.root!), true}'`);
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
         * calcualte the correct size of the view.
         */
        this.explorerTreeService.layout();
    }

    public async close(): Promise<void> {
        if (!this.isOpened) {
            return;
        }

        await this.explorerTreeService.close();

        this.__unloadCurrentView();
        const emptyView = this.__createEmptyView();
        this.__loadCurrentView(emptyView, true);
    }

    // [protected overrdie method]

    protected override __createTitlePart(): ExplorerTitlePart {
        return new ExplorerTitlePart(this.i18nService);
    }

    protected override _createContent(): void {
        super._createContent();

        // render title part
        this._titlePart.render(document.createElement('div'));
        this.element.appendChild(this._titlePart.element);

        /**
         * If there are waiting URIs to be opened, we will open it once we are 
         * creating the UI component.
         */
        const uriToOpen = this.envrionmentService.configuration.uriOpenConfiguration;
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
        if (this.explorerTreeService.root) {
            const workspace = URI.join(this.explorerTreeService.root, '|directory');
            await this.hostService.setApplicationStatus(StatusKey.LastOpenedWorkspace, URI.toString(workspace));
        } else {
            await this.hostService.setApplicationStatus(StatusKey.LastOpenedWorkspace, '');
        }
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
     * indicates if operation successed.
     */
    private async __tryOpen(path: URI): Promise<[HTMLElement, boolean]> {
        let success = true;
        let container = this.__createOpenedView();

        /**
         * Open the root in the explorer tree service who will handle the 
         * complicated stuff for us.
         */
        try {
            await this.explorerTreeService.init(container, path);
            this._onDidOpen.fire({ path: path });
        }
        /**
         * If the initialization fails, we capture it and replace it with an
         * empty view.
         */
        catch (error) {
            success = false;
            container = this.__createEmptyView();
            this.logService.error(`[ExplorerView] cannot open the view at given path '${URI.toString(path, true)}': ${errorToMessage(error)}`);
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

        // renders toolbar
        this._toolbar.render(view);

        return view;
    }

    private __registerEmptyViewListeners(): void {
        if (this.isOpened || !this._currentView) {
            return;
        }

        const disposables = this._currentListeners;

        /**
         * Empty view openning directory dialog listener (only open the last 
         * selected one).
         */
        const emptyView = this._currentView;
        const tag = emptyView.children[0]!;
        disposables.register(
            addDisposableListener(tag, EventType.click, () => {
                this.dialogService.openDirectoryDialog({ title: 'open a directory' })
                    .then(path => {
                        if (path.length > 0) {
                            this.open(URI.fromFile(path.at(-1)!));
                        }
                    });
            }
            ));
    }

    private __registerNonEmptyViewListeners(view: HTMLElement): void {
        if (!this.isOpened || !this._currentView) {
            return;
        }

        const disposables = this._currentListeners;

        /**
         * The tree model of the tree-service requires the correct height thus 
         * we need to update it everytime we are resizing.
         */
        disposables.register(this.workbenchService.onDidLayout(() => this.explorerTreeService.layout()));

        // on openning file.
        disposables.register(this.explorerTreeService.onSelect(e => {
            this.editorService.openSource(e.item.uri);
        }));

        // Displays the utility buttons only when hovering the view.
        disposables.register(addDisposableListener(view, EventType.mouseover, () => this._toolbar.show()));
        disposables.register(addDisposableListener(view, EventType.mouseout, () => this._toolbar.hide()));
    }
}

export class Toolbar {

    // [field]

    private readonly _element: HTMLElement;
    private readonly _visibilityController = new VisibilityController();
    private readonly _buttons: WidgetBar<Button>;

    // [constructor]

    constructor() {

        this._element = document.createElement('div');
        this._element.className = 'toolbar';

        this._visibilityController.setDomNode(this._element);

        this._buttons = new WidgetBar(undefined, {
            orientation: Orientation.Horizontal,
            render: false,
        });
        [
            { id: 'new-file', icon: Icons.AddDocument, classes: [], fn: () => { } },
            { id: 'new-directory', icon: Icons.AddFolder, classes: [], fn: () => { } },
            { id: 'collapse-all', icon: Icons.FolderMinus, classes: [], fn: () => { } },
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

        // toolbar container
        const toolBarContainer = document.createElement('div');
        toolBarContainer.className = 'toolbar-container';
        toolBarContainer.style.setProperty('--toolbar-container-background', (new RGBA(0, 0, 0, 0.05)).toString());
        this._buttons.render(toolBarContainer);

        this._element.appendChild(toolBarContainer);
        parent.appendChild(this._element);
    }

    public show(): void {
        this._visibilityController.setVisibility(true);
    }

    public hide(): void {
        this._visibilityController.setVisibility(false);
    }
}

export class ExplorerTitlePart extends SideViewTitlePart {

    constructor(
        private readonly i18nService: Ii18nService,
    ) {
        super();
    }

    public override render(element: HTMLElement): void {
        super.render(element);

        // left part
        const leftContainer = document.createElement('div');
        leftContainer.className = 'left-part';

        // title text
        const topText = document.createElement('div');
        topText.className = 'title-text';
        topText.textContent = this.i18nService.trans(Section.Explorer, 'file');
        // dropdown icon
        const dropdownIcon = createIcon(Icons.AngleDown);

        // right part
        const rightContainer = document.createElement('div');
        rightContainer.className = 'right-part';
        // menu dots
        const menuDots = createIcon(Icons.MenuDots);

        leftContainer.append(topText);
        leftContainer.append(dropdownIcon);

        rightContainer.append(menuDots);

        this.element.appendChild(leftContainer);
        this.element.appendChild(rightContainer);
    }
}
