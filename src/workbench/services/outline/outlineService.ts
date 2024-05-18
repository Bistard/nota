import "src/workbench/services/outline/outline.scss";
import { CollapseState, DirectionX, DirectionY } from "src/base/browser/basic/dom";
import { ToggleCollapseButton } from "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton";
import { Disposable, DisposableManager } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { Result, err } from "src/base/common/result";
import { ICommandService } from "src/platform/command/common/commandService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { HeadingItemProvider, HeadingItemRenderer } from "src/workbench/services/outline/headingItemRenderer";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IOutlineTree, OutlineTree } from "src/workbench/services/outline/outlineTree";

export const IOutlineService = createService<IOutlineService>('outline-service');

/**
 * An interface only for {@link OutlineService}.
 */
export interface IOutlineService extends IService, Disposable {
    
    /**
     * Represents if the service is initialized.
     */
    readonly isInitialized: boolean;

    /**
     * Represents the root URI of the current opening outline file.
     * @note Returns `null` if the service is not initialized.
     */
    readonly root: URI | null;

    /**
     * Fires every time once the outline view finishes rendering.
     */
    readonly onDidRender: Register<void>;

    /**
     * Fires when any heading is clicked from the view.
     */
    readonly onDidClick: Register<string>;

    /**
     * @description Initialize the outline display for the current opening file
     * in the editor. 
     * 
     * @note The content will be retrieved from the {@link EditorService}.
     * @note If the {@link EditorService} is not initialized, no operations will 
     *       be taken.
     */
    init(): Result<void, Error>;

    /**
     * @description Destroy the entire outline view and releases related 
     * memories. After `close()` the outline service can still be reinitialized.
     */
    close(): void;
}

export class OutlineService extends Disposable implements IOutlineService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidRender = this.__register(new Emitter<void>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidClick = this.__register(new Emitter<string>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [fields]

    private _container?: HTMLElement;
    private _button?: ToggleCollapseButton;
    
    private _heading?: HTMLElement; // The heading element displaying the file name
    private _currFile?: URI; // The URI of the current file being used to display the outline
    private _tree?: IOutlineTree; // the actual tree view
    private _treeDisposable?: DisposableManager; // stores all the disposable along with the tree

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IEditorService private readonly editorService: IEditorService,
        @ICommandService private readonly commandService: ICommandService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IWorkspaceService private readonly workspaceService: IWorkspaceService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this.logService.debug('OutlineService', 'Constructed.');
        
        this._tree = undefined;
        this._currFile = undefined;
        this._button = undefined;
        this._heading = undefined;
        this._treeDisposable = undefined;

        this.__registerListeners();
    }

    // [getter]

    get isInitialized(): boolean {
        return !!this.root;
    }

    get root(): URI | null {
        return this._currFile ?? null;
    }

    // [public methods]

    public init(): Result<void, Error> {
        this.logService.debug('OutlineService', 'Initializing...');
        
        // validation
        const editor = this.editorService.editor;
        if (!editor) {
            return err(new Error('OutlineService cannot initialized when the EditorService is not initialized.'));
        }

        // init container
        const container = this.__renderOutline();
        return this.__initTree(container)
            .map(() => {
                this.logService.debug('OutlineService', 'Initialized successfully.');
            });
    }
    
    public close(): void {
        this.logService.debug('OutlineService', 'Closing...');

        this.__removeTree();
        this._button?.dispose();
        this._button = undefined;
        
        this._container?.remove();
        this._container = undefined;
    }

    public override dispose(): void {
        this.close();
        super.dispose();
    }

    // [private helper methods]

    private async __registerListeners(): Promise<void> {

        /**
         * Make sure the outline is only able to init after the crucial UIs are 
         * created.
         */
        await this.lifecycleService.when(LifecyclePhase.Displayed);
        
        // init when needed
        this.__register(this.editorService.onDidOpen(uri => {
            
            // make sure no excessive rendering for the same file
            if (this._currFile && URI.equals(uri, this._currFile)) {
                return;
            }
            
            /**
             * When a file is opened, `init()` only invoked when this is the first 
             * time constructing the outline service, otherwise only re-initialize
             * the tree itself.
             */
            const afterWork = (() => {
                // init
                if (!this._tree) {
                    return this.init();
                } 
                // remove outline content if defined
                else {
                    this.__removeTree();
                    return this.__initTree(this._container!);
                }
            })();

            afterWork.match(noop, error => this.commandService.executeCommand(AllCommands.alertError, 'OutlineService', error));
        }));
    }

    private __initTree(container: HTMLElement): Result<void, Error> {
        
        // tree initialization
        return Result.fromThrowable<OutlineTree, Error>(() => {
            
            /**
             * When constructing a {@link OutlineTree}, the tree itself will 
             * parse the current file content and filter out the headings into 
             * a tree structure.
             */
            return this.instantiationService.createInstance(
                OutlineTree,
                container,
                [new HeadingItemRenderer()],
                new HeadingItemProvider(),
                { 
                    transformOptimization: true,
                    collapsedByDefault: false,
                    identityProvider: {
                        getID: heading => heading.id.toString(),
                    },
                }
            );
        })
        // after work
        .map(tree => {
            this._tree = tree;
            this._currFile = tree.fileURI;
            this.__updateHeading(tree.fileURI);

            const cleanup = new DisposableManager();
            this._treeDisposable = cleanup;

            // listeners
            cleanup.register(this._tree.onDidHover(e => {
                console.log(e); // TEST only
                if (e.isOverflow) {
                    // TODO: render a hover box
                }
            }));
        });
    }

    private __removeTree(): void {
        this._currFile = undefined;

        this._tree?.dispose();
        this._tree = undefined;

        this._treeDisposable?.dispose();
        this._treeDisposable = undefined;
        
        this._heading?.remove();
        this._heading = undefined;
    }

    private __renderOutline(): HTMLElement {
        const workspace = this.workspaceService.element;
        
        const container = document.createElement('div');
        container.className = 'outline';

        // create outline toggle button
        const toggleState = this.configurationService.get(WorkbenchConfiguration.OutlineToggleState, CollapseState.Expand);
        this._button = new ToggleCollapseButton({
            initState: toggleState,
            positionX: DirectionX.Left,
            positionOffsetX: -3,
            positionY: DirectionY.Top,
            positionOffsetY: 15.2,
            direction: DirectionX.Right,
        });
        this._button.render(container);

        this.__register(this._button.onDidCollapseStateChange(state => {
            this.toggleOutlineVisibility(state === CollapseState.Collapse);
        }));

        workspace.appendChild(container);
        this._container = container;

        return container;
    }

    private __updateHeading(uri: URI): void {
        if (!this._container) return;

        if (this._heading) {
            this._heading.remove();
        }

        const fileName = URI.basename(uri);
        this._heading = document.createElement('div');
        this._heading.className = 'file-name-heading';
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = fileName;
        this._heading.appendChild(fileNameSpan);
        
        this._container.insertBefore(this._heading, this._container.firstChild);
    }

    private toggleOutlineVisibility(isCollapsed: boolean): void {
        const editorElement = this.editorService.element;
        if (isCollapsed) {
            this._container?.classList.add('hidden');
            this._container?.classList.remove('visible');
            if (editorElement) editorElement.element.style.paddingRight = '0';
        } else {
            this._container?.classList.add('visible');
            this._container?.classList.remove('hidden');
            if (editorElement) editorElement.element.style.paddingRight = '230px';
        }
    }
}
