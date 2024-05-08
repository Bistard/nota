import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { Result, err, ok } from "src/base/common/result";
import { assert, panic } from "src/base/common/utilities/panic";
import { ICommandService } from "src/platform/command/common/commandService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export const IOutlineService = createService<IOutlineService>('outline-service');

/**
 * An interface only for {@link OutlineService}.
 */
export interface IOutlineService extends IService, Disposable {
    
    /**
     * Fires every time once the outline view finishes rendering.
     */
    readonly onDidRender: Register<void>;

    /**
     * Fires when any heading is clicked from the view.
     */
    readonly onDidClick: Register<string>;

    /**
     * @description Initialize the outline rendering next to the editor. Once
     * invoked, the service will start listening to any heading-related changes 
     * from the editor and update it on the outline view.
     * @param content An array of content in string, every string represent a
     *                row of a file.
     */
    init(content: string[]): Result<void, Error>;

    /**
     * @description Destroy the entire outline view and releases related 
     * memories. After `close()` the outline service can still be reinitialized.
     */
    close(): void;
}

export class OutlineService extends Disposable implements IOutlineService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _onDidRender = this.__register(new Emitter<void>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidClick = this.__register(new Emitter<string>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IEditorService private readonly editorService: IEditorService,
        @ICommandService private readonly commandService: ICommandService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {
        super();
        this.logService.debug('OutlineService', 'Constructed.');
        this.__registerListeners();
    }

    // [public methods]

    public init(content: string[]): Result<void, Error> {
        this.logService.debug('OutlineService', 'Initializing...');
        return err(new Error('not implemented'));
    }

    public close(): void {
        this.logService.debug('OutlineService', 'Closing...');
        panic('not implemented');
    }

    public override dispose(): void {
        this.close();
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
            
            // close before init
            this.close();
            
            // init
            const editor = assert(this.editorService.editor);
            this.init(editor.model.getContent())
                .match(
                    () => this.logService.debug('OutlineService', 'Initialized successfully.'),
                    error => this.commandService.executeCommand(AllCommands.alertError, 'OutlineService', error),
                );
        }));
    }
}