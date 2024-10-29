
/**
 * A utility class for dynamically constructing and manipulating regular 
 * expressions. 
 * 
 * `SmartRegExp` allows for controlled replacement of parts of a regular 
 * expression pattern.
 */
export class SmartRegExp {

    // [fields]

    private _source: string;
    private _flag?: string;

    // [constructor]

    constructor(raw: RegExp | string, flag?: string) {
        if (typeof raw === 'string') {
            this._source = raw;
            this._flag = flag;
        } else {
            this._source = raw.source;
            this._flag = flag ?? raw.flags;
        }
    }

    // [public methods]

    public replace(name: string | RegExp, value: string | RegExp): this {
        let valSource = typeof value === 'string' ? value : value.source;
        valSource = valSource.replace(/(^|[^[])\^/g, '$1');
        this._source = this._source.replace(name, valSource);
        return this;
    }

    public get(): RegExp {
        return new RegExp(this._source, this._flag);
    }
}