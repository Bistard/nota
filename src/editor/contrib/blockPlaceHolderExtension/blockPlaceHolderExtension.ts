import "src/editor/contrib/blockPlaceHolderExtension/blockPlaceHolder.scss";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseUtils } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { ProseDecoration, ProseDecorationSet, ProseDecorationSource, ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { I18nService, II18nService } from "src/platform/i18n/browser/i18nService";

interface IEditorBlockPlaceHolderExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.BlockPlaceHolder;
}

export class EditorBlockPlaceHolderExtension extends EditorExtension implements IEditorBlockPlaceHolderExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.BlockPlaceHolder;

    constructor(
        editorWidget: IEditorWidget,
        @II18nService private readonly i18nService: I18nService,
    ) {
        super(editorWidget);
    }

    // [private methods]

    /**
     * @note Place-holder rendering.
     */
    protected override onDecoration(state: ProseEditorState): ProseDecorationSource | null {
        const isEmptyBlock = ProseUtils.Cursor.isOnEmpty(state);
        if (!isEmptyBlock) {
            return null;
        }
        
        const { $from } = state.selection;
        const deco = ProseDecoration.widget($from.pos, () => {
            const span = document.createElement('span');
            span.className = 'slash-command-placeholder';
            span.textContent = this.i18nService.localize('emptyBlockPlaceHolder', "Start typing, or press '@' for AI, '/' for commands...");
            return span;
        }, {
            side: -1,
            key: 'slash-command-placeholder',
            ignoreSelection: true,
        });
        return ProseDecorationSet.create(state.doc, [deco]);
    }
}
