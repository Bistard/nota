import "src/workbench/services/outline/outline.scss";
import { CollapseState, DirectionX, DirectionY } from "src/base/browser/basic/dom";
import { ToggleCollapseButton } from "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton";
import { MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { Result, err } from "src/base/common/result";
import { Stack } from "src/base/common/structures/stack";
import { ICommandService } from "src/platform/command/common/commandService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { HeadingItem } from "src/workbench/services/outline/headingItem";
import { HeadingItemProvider, HeadingItemRenderer } from "src/workbench/services/outline/headingItemRenderer";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";

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

    private _container?: HTMLElement; // The container that contains the entire outline view
    private _currFile?: URI; // The URI of the current file being used to display the outline. 
    private _tree?: MultiTree<HeadingItem, void>; // the actual tree view

    private readonly _button: ToggleCollapseButton;
    private _isVisible: boolean = true;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IEditorService private readonly editorService: IEditorService,
        @ICommandService private readonly commandService: ICommandService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IWorkspaceService private readonly workspaceService: IWorkspaceService,
        @IConfigurationService configurationService: IConfigurationService,
    ) {
        super();
        this.logService.debug('OutlineService', 'Constructed.');
        
        this._tree = undefined;
        this._currFile = undefined;
        
        const toggleState = configurationService.get(WorkbenchConfiguration.OutlineToggleState, CollapseState.Expand);
        this._button = new ToggleCollapseButton({
            initState: toggleState,
            positionX: DirectionX.Left,
            positionOffsetX: -3,
            positionY: DirectionY.Top,
            positionOffsetY: 15.2,
            direction: DirectionX.Right,
        });

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
    
        const editor = this.editorService.editor;
        if (!editor) {
            return err(new Error('OutlineService cannot initialized when the EditorService is not initialized.'));
        }

        const content = editor.model.getContent();
        
        const container = this.__renderOutline(); // 'outline'
        this._button.render(container);
        const root = buildOutlineTree(content);

        return this.__setupTree(container, root)
            .map(() => {
                this._currFile = editor.model.source;
                this.logService.debug('OutlineService', 'Initialized successfully.');
            });
    }
    
    public close(): void {
        this.logService.debug('OutlineService', 'Closing...');

        this._currFile = undefined;

        this._tree?.dispose();
        this._tree = undefined;
        
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
            
            // close before init
            this.close();
            
            // init
            this.init().match(noop, error => this.commandService.executeCommand(AllCommands.alertError, 'OutlineService', error));
        }));

        this._button.onDidCollapseStateChange((state: CollapseState) => {
            this.toggleOutlineVisibility(state === CollapseState.Collapse);
        });
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

    private __renderOutline(): HTMLElement {
        const workspace = this.workspaceService.element;
        
        const container = document.createElement('div');
        container.className = 'outline';

        const editor = this.editorService.editor;
        let fileName = '';
        if (editor && editor.model && editor.model.source) {
            fileName = editor.model.source.path.split('/').pop() || fileName;
        }
        const heading = document.createElement('div');
        heading.className = 'file-name-heading';
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = fileName;
        heading.appendChild(fileNameSpan);
        
        container.appendChild(heading);
        workspace.appendChild(container);
        this._container = container;

        return container;
    }

    private __setupTree(container: HTMLElement, root: ITreeNodeItem<HeadingItem>): Result<void, Error> {
        return Result.fromThrowable(() => {
            const tree = new MultiTree<HeadingItem, void>(
                container,
                root.data,
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
        
            tree.splice(root.data, root.children);
            tree.layout();
            
        }, error => error as Error);
    }   
}

/**
 * @description Converts an array of markdown content to a tree structure of 
 * {@link HeadingItem}.
 * @param content Array of markdown lines to be converted.
 * @returns The root node of the tree structure for later rendering purpose.
 * 
 * @note Export for unit test purpose.
 */
export function buildOutlineTree(content: string[]): ITreeNodeItem<HeadingItem> {
    const root: ITreeNodeItem<HeadingItem> = {
        data: new HeadingItem(0, HeadingItem.ROOT_ID, 0),
        children: []
    };

    const stack = new Stack<ITreeNodeItem<HeadingItem>>();
    stack.push(root);

    content.forEach((line, lineNumber) => {
        let level = 0;
        while (line.charAt(level) === '#') {
            level++;
            
            // not a heading (perf: avoid blocking when a line start with countless of `#`)
            if (level > 6) {
                return;
            }
        }

        // not a heading
        if (level === 0) {
            return;
        }
    
        const name = line.slice(level + 1, undefined).trim();
        const item = new HeadingItem(lineNumber, name, level);
        const node = { data: item, children: [] } as ITreeNodeItem<HeadingItem>;

        // Backtrack to find the correct parent level
        while (stack.top().data.depth >= level) {
            stack.pop();
        }

        stack.top().children!.push(node);
        stack.push(node);
    });

    return root;
}