
export interface IBuiltInIcon {
    readonly id: string;
    readonly content: string;
}

/**
 * The Icon Library is a set of default icons that are built-in in Nota.
 */
export class BuiltInIcon {

    public readonly id: string;
    public readonly content: string;

    constructor(id: string, content: string) {
        this.id = id;
        this.content = content;
    }

    /* A series of built-in icons */
    public static readonly file = new BuiltInIcon('file', '\\f101');
    public static readonly outline = new BuiltInIcon('outline', '\\f102');

}