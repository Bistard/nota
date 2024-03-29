import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/proseMirror";
import { EditorSchema } from "src/editor/viewModel/schema";

export const enum EditorType {
    Plain = 'plain-text',
    Split = 'split-view',
    Rich = 'rich-text',
}

export interface IEditorViewModel extends Disposable {

    /**
     * The current rendering mode of the view.
     */
    readonly renderMode: EditorType;

    readonly model: IEditorModel;

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;
    readonly onRender: Register<IRenderEvent>;
    readonly onDidRenderModeChange: Register<EditorType>;

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
     * @default EditorType.Rich
     */
    mode?: EditorType;

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
    readonly type: EditorType.Plain;

    /**
     * The plain text for rendering.
     */
    readonly plainText: string[];
}

export interface IRenderSplitEvent {

    /**
     * The target displaying type for the view.
     */
    readonly type: EditorType.Split;

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
    readonly type: EditorType.Rich;

    /**
     * The parsed document that is used for user displaying.
     */
    readonly document: ProseNode;
}

export function isRenderPlainEvent(event: any): event is IRenderPlainEvent {
    return event.type === EditorType.Plain;
}
export function isRenderSplitEvent(event: any): event is IRenderSplitEvent {
    return event.type === EditorType.Split;
}
export function isRenderRichEvent(event: any): event is IRenderRichEvent {
    return event.type === EditorType.Rich;
}
