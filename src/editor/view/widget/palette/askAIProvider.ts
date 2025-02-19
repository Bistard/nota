import { MenuAction, SimpleMenuAction } from "src/base/browser/basic/menu/menuItem";
import { IEditorWidget } from "src/editor/editorWidget";
import { II18nService } from "src/platform/i18n/browser/i18nService";


export class AskAIProvider {

    constructor(
        private readonly editorWidget: IEditorWidget,
        @II18nService private readonly i18nService: II18nService,
    ) {}

    public getContent(): MenuAction[] {
        const contents: MenuAction[] = [];

        [
            'Continue Writing',
            'Make a Summary',
            'Make a Outline',
        ]
        .forEach(name => {
            contents.push(new SimpleMenuAction({
                id: name,
                enabled: true,
                callback: () => {},
            }));
        });
        
        return contents;
    }
}