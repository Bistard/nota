import { MenuAction, SimpleMenuAction } from "src/base/browser/basic/menu/menuItem";
import { IEditorWidget } from "src/editor/editorWidget";
import { IAITextService } from "src/platform/ai/common/aiText";
import { II18nService } from "src/platform/i18n/browser/i18nService";

export class AskAIProvider {

    constructor(
        private readonly editorWidget: IEditorWidget,
        @II18nService private readonly i18nService: II18nService,
        @IAITextService private readonly aiTextService: IAITextService,
    ) {}

    public getContent(): MenuAction[] {
        const contents: MenuAction[] = [];

        [
            { name: 'Continue Writing', prompt: 'Continue writing based on the given content.' },
            { name: 'Make a Summary', prompt: 'Make a summary of the given content.' },
            { name: 'Make a Outline', prompt: 'Make a outline of the givne content.' },
        ]
        .forEach(({ name, prompt }) => {
            contents.push(new SimpleMenuAction({
                id: name,
                enabled: true,
                callback: () => {
                    /**
                     * // TEST
                     */

                    const content = this.editorWidget.model.getRawContent();

                    let responseContent = '';

                    (async () => {
                        await this.aiTextService.sendRequestStream({
                            messages: [
                                {
                                    role: 'system',
                                    content: prompt,
                                },
                                {
                                    role: 'user',
                                    content: content,
                                }
                            ],
                            model: 'gpt-4o',
                            stream: true,
                        }, (response) => {
                            if (response.primaryMessage.content) {
                                this.editorWidget.type(response.primaryMessage.content);
                                responseContent += response.primaryMessage.content;
                                console.log(response.primaryMessage.content);
                            }
                        }).unwrap();

                        console.log(responseContent);
                    })();
                },
            }));
        });
        
        return contents;
    }
}