import { Character, CharCode } from "src/base/common/util/char";
import { EndOfLine, EndOfLineType, IPieceTable, ITextBuffer, ITextBufferBuilder } from "src/editor/common/model";
import { PieceTable } from "src/editor/model/pieceTable/pieceTable";

// REVIEW: should all the fields be readonly??
export class TextBuffer implements ITextBuffer {
    constructor(
        public buffer: string,
        public linestart: number[]
    ) {}

    /**
     * @description Read through the given string and counts all the newline characters.
     * @param string The given string.
     * @complexity O(n)
     */
    public static readLineStarts(string: string): { cr: number; lf: number; crlf: number; linestart: number[] } {
        const arr: number[] = [0]; // REVIEW: prof1: can we remove 0. prof2: tmp array
        let cr = 0;
        let lf = 0;
        let crlf = 0;

        let i = 0;
        let strlen = string.length;
        let c: number;
        for (i = 0; i < strlen; i++) {
            c = string.charCodeAt(i);

            if (c === CharCode.CarriageReturn) {
                // `/r/n`
                if (i + 1 !== strlen && string.charCodeAt(i + 1) === CharCode.LineFeed) {
                    arr.push(i + 2);
                    i++;
                    crlf++;
                } 
                // `/r`
                else {
                    arr.push(i + 1);
                    cr++;
                }
            } 
            // `/n`
            else if (c === CharCode.LineFeed) {
                arr.push(i + 1);
            }
        }

        return {
            cr: cr,
            lf: lf,
            crlf: crlf,
            linestart: arr
        };
    }

}

/**
 * @class The receiving phrase will receive string chunks and builds
 * corresponding {@link TextBuffer}. The building phrase will finish the 
 * receiving phrase. The creating phrase will create a {@link IPieceTable}.
 */
export class TextBufferBuilder implements ITextBufferBuilder {

    // [fields]

    private readonly _chunks: TextBuffer[] = [];
    private _prevChar: number | null = null;

    /**
     * CR = Carriage Return (\r, 0x0D) — moves the cursor to the beginning of 
     *      the line without advancing to the next line. 
     * LF = Line Feed (\n, 0x0A) — moves the cursor down to the next line 
     *      without returning to the beginning of the line.
     */
    
    private _cr: number = 0;
    private _lf: number = 0;
    private _crlf: number = 0;

    private _built: boolean = false;
    private _created: boolean = false;

    // [constructor]

    constructor() {

    }

    // [public methods]

    public receive(chunk: string): void {

        if (this._built || this._created) {
            throw new Error('TextBufferBuilder is already built or created');
        }
       
        // REVIEW: the string concatenation might need some work around.

        const chunkLength = chunk.length;
        if (chunkLength === 0) {
            return;
        }

        const lastChar = chunk.charCodeAt(chunkLength - 1);

        /**
         * JavaScript is using UTF-16 to encode its strings. It means two bytes
         * (16-bit) are used for every Unicode Code Point (eg. emoji).
         * 
         * Surrogates are always in pairs, with the high surrogate followed by 
         * the low.
         *      - High surrogates—U+D800 to U+DBFF (total of 1,024 code points)
         *      - Low surrogates—U+DC00 to U+DFFF (total of 1,024 code points)
         * 
         * Further reading: {@link https://www.informit.com/articles/article.aspx?p=2274038&seqNum=10}
         */

        let addPrevChar = false;
        let newChunk = chunk;
        if (Character.isHighSurrogate(lastChar) || CharCode.CarriageReturn === lastChar) {
            addPrevChar = true;
            newChunk = chunk.substring(0, chunkLength - 1); // remove that character for now
        }

        // If we have a previous character last time we omit it, we take it into account this time.
        if (this._prevChar) {
            newChunk = String.fromCharCode(this._prevChar).concat(chunk);
        }
        
        this.__receiveChunk(newChunk);

        // we need to store the previous character after we accepted the chunk.
        this._prevChar = addPrevChar ? lastChar : null;
    }

    public build(): void {
        if (this._built) {
            throw new Error('TextBufferBuilder cannot build twice');
        }

        // never received a chunk, we still need to push an empty StringBuffer.
        if (this._chunks.length === 0) {
            if (this._prevChar) {
                this.__receiveChunk(String.fromCharCode(this._prevChar));
            } else {
                this.__receiveChunk('');
            }
        } 
        
        // we have left a character, we need to concatenate it with the last buffer.
        else if (this._prevChar) {
            
            const lastChunk = this._chunks[this._chunks.length - 1]!;
            lastChunk.buffer.concat(String.fromCharCode(this._prevChar));
            
            if (this._prevChar === CharCode.CarriageReturn) {
                this._cr++;
                lastChunk.linestart.push(lastChunk.buffer.length - 1);
            } else if (this._prevChar === CharCode.LineFeed) {
                this._lf++;
                lastChunk.linestart.push(lastChunk.buffer.length - 1);
            }
        }

        this._built = true;
    }

    public create(defaultEOL: EndOfLineType, normalizationEOL: boolean): IPieceTable {
        if (this._created) {
            throw new Error('TextBufferBuilder cannot create twice');
        }

        const eol = this.__getEOF(defaultEOL);
        if (normalizationEOL) {
            this.__normalizeEOL(eol);
        }

        this._created = true;
        return new PieceTable(this._chunks);
    }

    // [private helper methods]

    private __receiveChunk(chunk: string): void {
        const {cr, lf, crlf, linestart} = TextBuffer.readLineStarts(chunk);
        
        this._chunks.push(new TextBuffer(chunk, linestart));
        this._cr += cr;
        this._lf += lf;
        this._crlf += crlf;
    }

    private __getEOF(defaultEOF: EndOfLineType): EndOfLine {

        const totalCR = this._cr + this._crlf;
        const totalEOF = totalCR + this._lf;
        
        // either empty file or file contains just one line.
        if (totalEOF === 0) {
            return defaultEOF === EndOfLineType.CRLF ? EndOfLine.CRLF : EndOfLine.LF;
        }

        if (totalCR > totalEOF / 2) {
            return EndOfLine.CRLF;
        } else {
            return EndOfLine.LF;
        }
    }

    private __normalizeEOL(EOF: EndOfLine): void {
        
        if (EOF === EndOfLine.CRLF && !this._cr && !this._lf) {
            return;
        }

        if (EOF === EndOfLine.LF && !this._cr && !this._crlf) {
            return;
        }
        
        for (const chunk of this._chunks) {
            // TODO
        }
    }

}
