import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/proseMirror";
import { EditorSchema } from "src/editor/viewModel/schema";

export const enum EditorRenderType {
    Plain = 'plain',
    Split = 'split',
    Rich = 'rich',
}

export interface IEditorViewModel extends Disposable {

    /**
     * The current rendering mode of the view.
     */
    readonly renderMode: EditorRenderType;

    readonly model: IEditorModel;

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;

    readonly onRender: Register<IRenderEvent>;

    readonly onDidChangeRenderMode: Register<EditorRenderType>;

    getSchema(): EditorSchema;

    getExtensions(): IEditorExtension[];

    /**
     * @description Updates the options of the editor view model.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewModelOptions>): void;
}

export interface IEditorViewModelOptions {

    /**
     * Determines how the editor is about to render the view.
     * @default EditorRenderType.Rich
     */
    mode?: EditorRenderType;

    /**
     * If enables code-block highlight functionality.
     * @default true
     */
    codeblockHighlight?: boolean;

    /**
     * When parsing, if ignores parse HTML content.
     * @default false
     */
    ignoreHTML?: boolean;
}

/**
 * Type of event to indicate how to render the data from the text model into the 
 * view.
 */
export type IRenderEvent = IRenderPlainEvent | IRenderSplitEvent | IRenderRichEvent;

export interface IRenderPlainEvent {
    
    /**
     * The target displaying type for the view.
     */
    readonly type: EditorRenderType.Plain;

    /**
     * The plain text for rendering.
     */
    readonly plainText: string[];
}

export interface IRenderSplitEvent {

    /**
     * The target displaying type for the view.
     */
    readonly type: EditorRenderType.Split;

    /**
     * The plain text for rendering.
     */
    readonly plainText: string[];

    /**
     * The parsed document that is used for user displaying.
     */
    readonly document: ProseNode;
}

export interface IRenderRichEvent {
    /**
     * The target displaying type for the view.
     */
    readonly type: EditorRenderType.Rich;

    /**
     * The parsed document that is used for user displaying.
     */
    readonly document: ProseNode;
}

export function isRenderPlainEvent(event: any): event is IRenderPlainEvent {
    return event.type === EditorRenderType.Plain;
}
export function isRenderSplitEvent(event: any): event is IRenderSplitEvent {
    return event.type === EditorRenderType.Split;
}
export function isRenderRichEvent(event: any): event is IRenderRichEvent {
    return event.type === EditorRenderType.Rich;
}
