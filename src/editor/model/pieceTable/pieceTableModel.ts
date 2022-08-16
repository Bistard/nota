import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { EndOfLine, IApplyEditResult, IEditOperation, IPieceNode, IPieceTable, IPieceTableModel, ITextBuffer } from "src/editor/common/model";
import { IEditorPosition } from "src/editor/common/position";
import { PieceTable } from "src/editor/model/pieceTable/pieceTable";

/**
 * @class An wrapper text model built on top of a {@link PieceTable}.
 */
export class PieceTableModel extends Disposable implements IPieceTableModel {

    // [fields]

    private _table: IPieceTable;

    // [event]

    private readonly _onDidChangeContent = this.__register(new Emitter<void>());
    public readonly onDidChangeContent = this._onDidChangeContent.registerListener;

    // [constructor]

    constructor(
        chunks: ITextBuffer[], 
        shouldBeNormalized: boolean, 
        normalizedEOL: EndOfLine
    ) {
        super();

        this._table = new PieceTable(chunks, shouldBeNormalized, normalizedEOL);
    }

    // [public methods]

    public getPieceTable(): IPieceTable {
        return this._table;
    }

    public insertAt(textOffset: number, text: string): void {
        this._table.insertAt(textOffset, text);
    }

    public deleteAt(textOffset: number, length: number): void {
        this._table.deleteAt(textOffset, length);
    }

    public getContent(): string[] {
        return this._table.getContent();
    }

    public getRawContent(): string {
        return this._table.getRawContent();
    }

    public getLine(lineNumber: number): string {
        return this._table.getLine(lineNumber);
    }

    public getRawLine(lineNumber: number): string {
        return this._table.getRawLine(lineNumber);
    }

    public getLineLength(lineNumber: number): number {
        return this._table.getLineLength(lineNumber);
    }

    public getRawLineLength(lineNumber: number): number {
        return this._table.getRawLineLength(lineNumber);
    }

    public getBufferLength(): number {
        return this._table.getBufferLength();
    }

    public getLineCount(): number {
        return this._table.getLineCount();
    }

    public getOffsetAt(lineNumber: number, lineOffset: number): number {
        return this._table.getOffsetAt(lineNumber, lineOffset);
    }

    public getPositionAt(textOffset: number): IEditorPosition {
        return this._table.getPositionAt(textOffset);
    }

    public getCharcodeByOffset(textOffset: number): number {
        return this._table.getCharcodeByOffset(textOffset);
    }

    public getCharcodeByLine(lineNumber: number, lineOffset: number): number {
        return this._table.getCharcodeByLine(lineNumber, lineOffset);
    }

    public forEach(fn: (node: IPieceNode) => void): void {
        this._table.forEach(fn);
    }

    public edit(rawOperations: IEditOperation[]): IApplyEditResult {
        
        const operations: any[] = [];

        for (let i = 0; i < rawOperations.length; i++) {
            const oper = rawOperations[i]!;
        }

        // TODO
        return {
            changes: []
        };
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

}