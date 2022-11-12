import { URI } from "src/base/common/file/uri";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { Component, IComponent } from "src/code/browser/service/component/component";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { EditorWidget, IEditorWidget } from "src/editor/editorWidget";
import { EditorModel } from "src/editor/model/editorModel";
import { Editor as MilkdownEditor, rootCtx } from '@milkdown/core';
import { nordLight } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { clipboard } from "@milkdown/plugin-clipboard";
import { cursor } from "@milkdown/plugin-cursor";
import { emoji } from "@milkdown/plugin-emoji";
import { history } from "@milkdown/plugin-history";
import { listener } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { prism } from "@milkdown/plugin-prism";
import { slash } from "@milkdown/plugin-slash";
import { tooltip } from "@milkdown/plugin-tooltip";
import { gfm } from "@milkdown/preset-gfm";
import { menu } from '@milkdown/plugin-menu';
import { block } from '@milkdown/plugin-block';
import { upload } from "@milkdown/plugin-upload";
import * as milkdownUtility from "@milkdown/utils";

export const IEditorService = createService<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

    /**
     * @description Openning a source given the URI in the editor.
     * @param source The {@link URI} or an RUI in the string form.
     */
    openSource(source: URI | string): void;

    updateMilkdownText(source: URI | string): Promise<void>;
}

export class Editor extends Component implements IEditorService {

    // [field]

    private _editorWidget: IEditorWidget | null;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @IThemeService themeService: IThemeService,
    ) {
        super('editor', null, themeService, componentService);
        this._editorWidget = null;

        this.createMilkdownEditor();
    }

    // [public methods]

    public openSource(source: URI | string): void {
        
        if (this._editorWidget === null) {
            throw new Error('editor service is currently not created');
        }
        
        let uri = source;
        if (!(uri instanceof URI) && !URI.isURI(uri)) {
            uri = URI.fromFile(<string>source);
        }
        
        const textModel = new EditorModel(uri, this.fileService);
        textModel.onDidBuild(isSuccess => {
            if (!isSuccess || !this._editorWidget) {
                console.warn(isSuccess);
                return;
            }

            this._editorWidget.attachModel(textModel);
        });
    }

    private editor!: MilkdownEditor;
    public async createMilkdownEditor(): Promise<void> {
        this.editor = 
            await MilkdownEditor.make()
            .config((ctx) => {
                ctx.set(rootCtx, this.element.element);
            })
            .use(nordLight)
            .use(commonmark)
            .use(clipboard)
            .use(cursor)
            .use(emoji)
            .use(history)
            .use(listener)
            .use(math)
            .use(slash)
            .use(tooltip)
            .use(gfm)
            .use(menu)
            .use(block)
            .use(prism)
            .use(upload)
            .create();
    }

    public async updateMilkdownText(source: URI | string): Promise<void> {
        let uri: URI;
        
        if ((source instanceof URI)) {
            uri = source;
        } else {
            uri = URI.fromFile(source);
        }

        const content = (await this.fileService.readFile(uri)).toString();

        // replace all text
        this.editor.action(milkdownUtility.replaceAll(content));
    }

    // [override protected methods]

    protected override _createContent(): void {
        this._editorWidget = this.instantiationService.createInstance(
            EditorWidget, 
            this.element.element,
            {},
        );
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper methods]

}

registerSingleton(IEditorService, new ServiceDescriptor(Editor));