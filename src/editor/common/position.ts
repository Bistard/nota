
export interface IEditorPosition {
    /**
     * Line number (zero-based).
     */
    readonly lineNumber: number;

    /**
     * Line offset (zero-based). First character in a line.
     */
    readonly lineOffset: number;
}

/**
 * @class Representing a position in a editor. 
 * Supports a various of helper methods.
 */
export class EditorPosition implements IEditorPosition {

    // [field]

    public readonly lineNumber: number;
    public readonly lineOffset: number;

    // [constructor]

    constructor(lineNumber: number, lineOffset: number) {
        this.lineNumber = lineNumber;
        this.lineOffset = lineOffset;
    }

    // [public static methods]
    
    // [public methods]



}