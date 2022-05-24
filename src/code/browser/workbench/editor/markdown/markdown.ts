import { Component, IComponent } from 'src/code/browser/workbench/component';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { EditorComponentType } from 'src/code/browser/workbench/editor/editor';
import { IFileLogService } from 'src/code/common/service/logService/fileLogService';
import { IGlobalConfigService, IUserConfigService } from 'src/code/common/service/configService/configService';
import { EUserSettings, IUserMarkdownSettings } from 'src/code/common/service/configService/configService';

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

    private editor: null;

    private _settings: IUserMarkdownSettings;

    // [constructor]

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
                @IFileLogService private readonly fileLogService: IFileLogService,
                @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
                @IUserConfigService private readonly userConfigService: IUserConfigService,
    ) {
        super(EditorComponentType.markdown, parentComponent, parentElement, componentService);

        this.editor = null;

        this._settings = this.userConfigService.get<IUserMarkdownSettings>(EUserSettings.Markdown);
    }

    // [protected override methods]

    protected override _createContent(): void {
        
        this.createEditor();
        
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

    private createEditor(): void {

        
    }

    // [private helper methods]
}

