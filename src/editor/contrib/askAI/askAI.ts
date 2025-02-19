import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";
import { AskAIProvider } from "src/editor/view/widget/palette/askAIProvider";
import { EditorPalette } from "src/editor/view/widget/palette/palette";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

interface IEditorAskAIExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.AskAI;
}

// region - EditorAskAIExtension

export class EditorAskAIExtension extends EditorExtension implements IEditorAskAIExtension {

    // [field]
    
    public override readonly id = EditorExtensionIDs.AskAI;
    private readonly _palette: EditorPalette;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(editorWidget);
        const provider = instantiationService.createInstance(AskAIProvider, editorWidget);
        this._palette = this.__register(instantiationService.createInstance(
            EditorPalette, 
            editorWidget, 
            {
                contentProvider: () => provider.getContent(),
            }
        ));

        // show event
        this.__register(this.onTextInput(e => this.tryShowAskAI(e)));
    }

    // [public methods]

    public tryShowAskAI(e: IOnTextInputEvent): void {

        const { text, view } = e;
        const { selection } = view.state;

        const isCursor = ProseTools.Cursor.isCursor(selection);
        if (!isCursor) {
            return;
        }

        const isEmptyBlock = ProseTools.Cursor.isOnEmpty(selection);
        const isSlash = text === '@';
        if (!isEmptyBlock || !isSlash) {
            return;
        }

        // show ask-AI palette
        const position = view.coordsAtPos(selection.$from.pos);
        this._palette.render(position);

        // re-focus back to editor, not the slash command.
        view.focus();
    }
}