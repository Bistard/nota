
/**
 * A range representation in the editor.
 */
export interface IEditorRange {
	/**
	 * Line number on which the range starts (zero-based).
	 */
	readonly startLineNumber: number;
	/**
	 * Column on which the range starts in line `startLineNumber` (zero-based).
	 */
	readonly startColumn: number;
	/**
	 * Line number on which the range ends.
	 */
	readonly endLineNumber: number;
	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	readonly endColumn: number;
}

export class EditorRange implements IEditorRange {

    // [field]

	public readonly startLineNumber: number;
	public readonly startColumn: number;
	public readonly endLineNumber: number;
	public readonly endColumn: number;

    // [constructor]

    constructor(
        startLineNumber: number, startColumn: number, 
        endLineNumber: number, endColumn: number
    ) {
		if ((startLineNumber > endLineNumber) || 
            (startLineNumber === endLineNumber && startColumn > endColumn)
        ) {
			this.startLineNumber = endLineNumber;
			this.startColumn = endColumn;
			this.endLineNumber = startLineNumber;
			this.endColumn = startColumn;
		} else {
			this.startLineNumber = startLineNumber;
			this.startColumn = startColumn;
			this.endLineNumber = endLineNumber;
			this.endColumn = endColumn;
		}
	}

    // [static helper methods]

    public static isEmpty(range: IEditorRange): boolean {
        return (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn);
    }

}