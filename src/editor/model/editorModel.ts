import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { AsyncResult, ok, Result } from "src/base/common/result";
import { Blocker } from "src/base/common/utilities/async";
import { assert } from "src/base/common/utilities/panic";
import { EditorOptionsType } from "src/editor/common/editorConfiguration";
import { EditorToken, IEditorModel, IModelBuildData, IPieceTable } from "src/editor/common/model";
import { IEditorPosition } from "src/editor/common/position";
import { IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdownLexer";
import { TextBufferBuilder } from "src/editor/model/textBuffer/textBufferBuilder";
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
    private readonly _source: URI;           // The reading target.
    private readonly _lexer: IMarkdownLexer; // Responsible for parsing the raw text into tokens.
    private _textBuffer?: IPieceTable;       // The SSOT (Single Source of Truth) for the text.
    private _dirty: boolean;                 // Indicates if the file has unsaved changes. Modify this through `this.setDirty()`

    // [constructor]

    constructor(
        source: URI,
        options: EditorOptionsType,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
        this._options = options;
        this._source = source;
        this._dirty = false;
        this._lexer = new MarkdownLexer(this.__initLexerOptions(options));
        logService.debug('EditorModel', 'Constructed');
    }

    // [getter / setter]

    get source(): URI { return this._source; }
    get dirty(): boolean { return this._dirty; }
    get textBuffer(): IPieceTable { return assert(this._textBuffer, 'Model not built yet.'); }

    // [public methods]

    public build(): AsyncResult<IModelBuildData, Error> {
        this.logService.debug('EditorModel', `Start building at: ${URI.toString(this.source)}`);
        return this.__buildTextBuffer(this.source)
            .andThen(textBuffer => this.__tokenizeBuffer(textBuffer))
            .andThen(tokens => ok<IModelBuildData, Error>({ tokens: tokens, }));
    }

    public getContent(): string[] {
        return this.textBuffer.getContent();
    }

    public getRawContent(): string {
        return this.textBuffer.getRawContent();
    }

    public getLine(lineNumber: number): string {
        return this.textBuffer.getLine(lineNumber);
    }

    public getRawLine(lineNumber: number): string {
        return this.textBuffer.getRawLine(lineNumber);
    }

    public getLineLength(lineNumber: number): number {
        return this.textBuffer.getLineLength(lineNumber);
    }

    public getRawLineLength(lineNumber: number): number {
        return this.textBuffer.getRawLineLength(lineNumber);
    }

    public getLineCount(): number {
        return this.textBuffer.getLineCount();
    }

    public getOffsetAt(lineNumber: number, lineOffset: number): number {
        return this.textBuffer.getOffsetAt(lineNumber, lineOffset);
    }

    public getPositionAt(textOffset: number): IEditorPosition {
        return this.textBuffer.getPositionAt(textOffset);
    }

    public getCharCodeByOffset(textOffset: number): number {
        return this.textBuffer.getCharcodeByOffset(textOffset);
    }

    public getCharCodeByLine(lineNumber: number, lineOffset: number): number {
        return this.textBuffer.getCharcodeByLine(lineNumber, lineOffset);
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

    private __buildTextBuffer(source: URI): AsyncResult<IPieceTable, Error> {
        return this.fileService
            .readFileStream(source, {})
            .andThen(async ready => {
                const builder = new TextBufferBuilder();
                const blocker = new Blocker<IPieceTable>();
                const stream = ready.flow();

                stream.on('data', data => {
                    builder.receive(data.toString());
                });

                stream.on('end', () => {
                    stream.destroy();
                    builder.build();
                    const textBuffer = builder.create();
                    blocker.resolve(textBuffer);
                });

                stream.on('error', (error) => {
                    stream.destroy();
                    blocker.reject(error);
                });

                this._textBuffer = await blocker.waiting();
                return this._textBuffer;
            });
    }

    private __tokenizeBuffer(buffer: IPieceTable): Result<EditorToken[], Error> {
        return ok(this._lexer.lex(buffer.getRawContent()));
    }
}