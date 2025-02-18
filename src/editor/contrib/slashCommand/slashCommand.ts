import "src/editor/contrib/slashCommand/slashCommand.scss";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";
import { BlockInsertPalette } from "src/editor/view/widget/blockInsertPalette/blockInsertPalette";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

interface IEditorSlashCommandExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.SlashCommand;
}

// region - EditorSlashCommandExtension

export class EditorSlashCommandExtension extends EditorExtension implements IEditorSlashCommandExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.SlashCommand;
    private readonly _palette: BlockInsertPalette;

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(editorWidget);
        this._palette = this.__register(instantiationService.createInstance(BlockInsertPalette, editorWidget));

        // slash-command rendering
        this.__register(this.onTextInput(e => this.__tryShowSlashCommand(e)));
    }

    // [private methods]

    private __tryShowSlashCommand(e: IOnTextInputEvent): void {
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
