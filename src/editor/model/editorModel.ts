import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { AsyncResult, ok } from "src/base/common/result";
import { EditorOptionsType } from "src/editor/common/editorConfiguration";
import { IEditorModel, IModelBuildData } from "src/editor/common/model";
import { IEditorPosition } from "src/editor/common/position";
import { IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdownLexer";
import { IFileService } from "src/platform/files/common/fileService";

export class EditorModel extends Disposable implements IEditorModel {

    // [events]

    private readonly _onDidSave = this.__register(new Emitter<void>({ onFire: () => this.setDirty(false) }));
    public readonly onDidSave = this._onDidSave.registerListener;

    private readonly _onDidSaveError = this.__register(new Emitter<unknown>());
    public readonly onDidSaveError = this._onDidSaveError.registerListener;

    private readonly _onDidDirtyChange = this.__register(new Emitter<boolean>());
    public readonly onDidDirtyChange = this._onDidDirtyChange.registerListener;

    // [fields]

    private readonly _options: EditorOptionsType; // The configuration of the editor
    private readonly _source: URI;           // The source file the model is about to read and parse.
    private readonly _lexer: IMarkdownLexer; // Responsible for parsing the raw text into tokens.
    private _dirty: boolean;                 // Indicates if the file has unsaved changes. Modify this through `this.setDirty()`

    // [constructor]

    constructor(
        source: URI,
        options: EditorOptionsType,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._source = source;
        this._options = options;
        this._dirty = false;
        this._lexer = new MarkdownLexer(this.__initLexerOptions(options));
        logService.debug('EditorModel', 'Constructed');
    }

    // [getter / setter]

    get source(): URI { return this._source; }
    get dirty(): boolean { return this._dirty; }

    // [public methods]

    public build(): AsyncResult<IModelBuildData, Error> {
        return this.__buildModel(this._source);
    }

    public getContent(): string[] {
        // TODO
        return [];
        // const state = assert(this._editorState);
        // const raw = this._docSerializer.serialize(state.doc);
        // return raw.split('\n');
    }

    public getRawContent(): string {
        return '';
        // const state = assert(this._editorState);
        // const raw = this._docSerializer.serialize(state.doc);
        // return raw; // TODO
    }

    public getLine(lineNumber: number): string {
        return ''; // TODO
    }

    public getRawLine(lineNumber: number): string {
        return ''; // TODO
    }

    public getLineLength(lineNumber: number): number {
        return -1; // TODO
    }

    public getRawLineLength(lineNumber: number): number {
        return -1; // TODO
    }

    public getLineCount(): number {
        return -1; // TODO
    }

    public getOffsetAt(lineNumber: number, lineOffset: number): number {
        return -1; // TODO
    }

    public getPositionAt(textOffset: number): IEditorPosition {
        return undefined!; // TODO
    }

    public getCharCodeByOffset(textOffset: number): number {
        return -1; // TODO
    }

    public getCharCodeByLine(lineNumber: number, lineOffset: number): number {
        return -1; // TODO
    }

    public setDirty(value: boolean): void {
        if (this._dirty === value) {
            return;
        }
        this._dirty = value;
        this._onDidDirtyChange.fire(value);
    }

    public save(): AsyncResult<void, Error> {
        if (this._dirty === false) {
            return AsyncResult.ok();
        }

        const serialized = this.getRawContent();
        const buffer = DataBuffer.fromString(serialized);

        return this.fileService.writeFile(this._source, buffer, { create: true, overwrite: true, unlock: false })
            .map(() => {
                this._onDidSave.fire();
            })
            .mapErr(error => {
                this.logService.trace('EditorModel', `File saved (${URI.toString(this._source)})`);
                this._onDidSaveError.fire(error);
                return error;
            });
    }

    // [private methods]

    private __initLexerOptions(options: EditorOptionsType): IMarkdownLexerOptions {
        return {
            baseURI: options.baseURI.value,
        };
    }

    private __buildModel(source: URI): AsyncResult<IModelBuildData, Error> {
        this.logService.debug('EditorModel', `Start building at: ${URI.toString(source)}`);

        return this.__readFileRaw(source)
            .andThen(raw => {
                const tokens = this._lexer.lex(raw);
                return ok({
                    tokens: tokens,
                });
            });
    }

    private __readFileRaw(source: URI): AsyncResult<string, Error> {
        return this.fileService.readFile(source, {})
            .map(buffer => buffer.toString());
    }
}