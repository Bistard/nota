import "src/editor/contrib/slashCommand/slashCommand.scss";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";
import { EditorPalette } from "src/editor/view/widget/palette/palette";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { BlockInsertProvider } from "src/editor/view/widget/palette/blockInsertProvider";

interface IEditorSlashCommandExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.SlashCommand;
}

// region - EditorSlashCommandExtension

export class EditorSlashCommandExtension extends EditorExtension implements IEditorSlashCommandExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.SlashCommand;
    private readonly _palette: EditorPalette;
    private readonly _contentProvider: BlockInsertProvider;

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(editorWidget);
        this._contentProvider = instantiationService.createInstance(BlockInsertProvider, editorWidget);

        this._palette = this.__register(instantiationService.createInstance(
            EditorPalette, 
            editorWidget,
            {
                contentProvider: () => this._contentProvider.getContent(),
            }
        ));

        // slash-command rendering
        this.__register(this.onTextInput(e => this.tryShowSlashCommand(e)));
    }

    // [public methods]

    public tryShowSlashCommand(e: IOnTextInputEvent): void {
        const { text, view } = e;
        const { selection } = view.state;

        const isCursor = ProseTools.Cursor.isCursor(selection);
        if (!isCursor) {
            return;
        }

        const isEmptyBlock = ProseTools.Cursor.isOnEmpty(selection);
        const isSlash = text === '/';
        if (!isEmptyBlock || !isSlash) {
            return;
        }

        // show slash command
        const position = view.coordsAtPos(selection.$from.pos);
        this._palette.render(position);

        // re-focus back to editor, not the slash command.
        view.focus();
    }
}
