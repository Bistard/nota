import { Constants, toUint8 } from "src/base/common/file/buffer";

export interface IWordSeparator {
    set(char: number, ifSeparator: boolean): boolean;
    get(char: number): boolean;
}


export class WordSeparator implements IWordSeparator {

    private _asciiSepMap: Uint8Array;

    constructor() {
        this._asciiSepMap = new Uint8Array(Constants.MAX_UINT_8);
        for (let i = 0; i < 256; i++) {
            this._asciiSepMap[i] = 0;
        }
    }

    public set(char: number, ifSeparator: boolean): boolean {
        if (0 <= char && char <= Constants.MAX_UINT_8) {
            this._asciiSepMap[char] = ifSeparator ? 1 : 0;
            return true;
        } else {
            return false;
        }
    }

    public get(char: number): boolean{
        if (0 <= char && char <= Constants.MAX_UINT_8) {
            return this._asciiSepMap[char]! === 1;
        } else {
            return false;
        }
    }
}
