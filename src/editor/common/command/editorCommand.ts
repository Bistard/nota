import { IShortcutRegistrant, IShortcutRegistration } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { IEditorService } from "src/code/browser/workbench/workspace/editor/editorService";
import { ICommandRegistrant, ICommandSchema } from "src/code/platform/command/common/commandRegistrant";
import { ContextKeyExpr, CreateContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";
import { IContextService } from "src/code/platform/context/common/contextService";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { ProseEditorState, ProseEditorView, ProseTransaction } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

const shortcutRegistrant = REGISTRANTS.get(IShortcutRegistrant);
const commandRegistrant = REGISTRANTS.get(ICommandRegistrant);

export interface IEditorCommandSchema extends Omit<ICommandSchema, 'overwrite'> {
    
    /**
     * The precondition that indicates if the command is valid to be invoked.
     */
    readonly when: ContextKeyExpr | null;

    /**
     * If the option is provided, the command will also be registered as a
     * shortcut.
     * @note The shortcut will only be avaliable when the command schema `when`
     * is satisfied.
     */
    readonly shortcutOptions?: IShortcutRegistration;
}

export interface IEditorCommandEvent {
    readonly state: ProseEditorState;
    readonly dispatch?: (tr: ProseTransaction) => void;
    readonly view?: ProseEditorView;
}

export abstract class EditorCommand {

    // [field]

    private readonly _schema: IEditorCommandSchema;

    // [constructor]

    constructor(schema: IEditorCommandSchema) {
        this._schema = schema;
        const actualSchema = { 
            ...schema, 
            overwrite: true,
        };

        // register as the shortcut if needed
        if (schema.shortcutOptions) {
            shortcutRegistrant.register({
                ...schema.shortcutOptions,
                when: CreateContextKeyExpr.And(schema.when, schema.shortcutOptions.when),
            });
        }
        
        // command registration
        commandRegistrant.registerCommand(actualSchema, this.runCommand.bind(this));
    }

    // [protected abstract methods]

    /**
     * @description The actual command implementation. 
     * @param provider A service provider that gives permission to access the
     *                 internal dependency injection to get all kinds of 
     *                 different micro-services.
     * @param editor The actual editor instance.
     * @param event An integration of possible data that the command might need.
     * @param args The other provided data.
     */
    protected abstract command(provider: IServiceProvider, editor: IEditorWidget, event: IEditorCommandEvent, ...args: any[]): void;

    // [public methods]

    get id(): string {
        return this._schema.id;
    }

    public runCommand(provider: IServiceProvider, event: IEditorCommandEvent, ...args: any[]): void {
        const editorService = provider.getOrCreateService(IEditorService);
        if (!editorService.editor) {
            return;
        }

        const contextService = provider.getOrCreateService(IContextService);
        if (!contextService.contextMatchExpr(this._schema.when)) {
            return;
        }

        this.command(provider, editorService.editor, event, ...args);
    }
}
