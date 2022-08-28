import { IEditorRange } from "src/editor/common/range";
import { IWordSeparator, WordSeparator } from "src/editor/common/wordSeparator";

export interface ISearchData {
    readonly toSearchRegex?: RegExp;
    readonly toSearchString?: string;
    readonly wordSeparator?: IWordSeparator;
}

export class SearchData implements ISearchData {
    public readonly toSearchRegex: RegExp | undefined;
    public readonly toSearchString: string | undefined;
    public readonly wordSeparator: IWordSeparator | undefined;

    constructor(toSearchRegex?: RegExp, toSearchString?: string, WordSeparator?: IWordSeparator) {
        this.toSearchRegex = toSearchRegex;
        this.toSearchString = toSearchString;
        this.wordSeparator = this.wordSeparator;
    }
}

export interface toSearchLineData {
    readonly lineContext: string;
    readonly lineNumber: number;
    readonly startColumn: number;
}

export class Match {
    public readonly range: IEditorRange;
    public RegExpMatches: string[];

    constructor(range: IEditorRange, matches: string[]) {
        this.range = range;
        this.RegExpMatches = matches;
    }
}

export function isValidMatch