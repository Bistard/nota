import { Component, IComponent } from 'src/code/browser/workbench/component';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { EditorComponentType } from 'src/code/browser/workbench/editor/editor';
import { IFileLogService } from 'src/code/common/service/logService/fileLogService';
import { IGlobalConfigService, IUserConfigService } from 'src/code/common/service/configService/configService';
import { EUserSettings, IUserMarkdownSettings } from 'src/code/common/service/configService/configService';
import { Editor, rootCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { Emitter } from 'src/base/common/event';

export const IMarkdownService = createDecorator<IMarkdownService>('markdown-service');

/**
 * An interface only for {@link MarkdownComponent}.
 */
export interface IMarkdownService extends IComponent {

}

export type MarkdownRenderMode = 'wysiwyg' | 'instant' | 'split';

/**
 * @class // TODO
 */
export class MarkdownComponent extends Component implements IMarkdownService {

    // [field]

    private editor: Editor | null;

    private _settings: IUserMarkdownSettings;

    // [constructor]

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @IComponentService componentService: IComponentService,
                @IFileLogService private readonly fileLogService: IFileLogService,
                @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
                @IUserConfigService private readonly userConfigService: IUserConfigService,
    ) {
        super(EditorComponentType.markdown, parentComponent, parentElement, componentService);

        this.editor = null;

        this._settings = this.userConfigService.get<IUserMarkdownSettings>(EUserSettings.Markdown);
    }

    // [event]

    private readonly _onDidCreationFinished = this.__register(new Emitter<boolean>());
    public readonly onDidCreationFinished = this._onDidCreationFinished.registerListener;

    // [protected override methods]

    protected override _createContent(): void {
        
        this.createEditor().then(success => {

            if (success) {
                // ...
                this._onDidCreationFinished.fire(true);
            }
            
            else {
                this._onDidCreationFinished.fire(false);
            }
        });
        
    }

    protected override _registerListeners(): void {
       
        /**
         * Listens to configuraion modification.
         */
        this.userConfigService.onDidChangeMarkdownSettings(newSettings => {
            this._settings = newSettings;
        });

    }

    // [public methods]

    private async createEditor(): Promise<boolean> {

        this.editor = await Editor.make().config((ctx) => {
            ctx.set(rootCtx, this.container);
        }).use(nord).use(commonmark).create();
        

        return true;
    }

    // [private helper methods]
}

