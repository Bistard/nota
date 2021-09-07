import { getFileType } from "src/base/common/string";

export enum FileType {
    MARKDOWN,
    OTHERS,
}

export interface IStat {

	readonly type: FileType;
	readonly createTime: number;
    readonly modifyTime: number;
	readonly byteSize: number;
	readonly readonly?: boolean;
}

export class File implements IStat {

	readonly type: FileType;
	readonly createTime: number;
	readonly modifyTime: number;
	readonly byteSize: number;

	readonly name: string;
	plainText: string;

	constructor(name: string, plainText?: string) {
		this.type = getFileType(name);
		this.createTime = Date.now();
		this.modifyTime = Date.now();
		this.byteSize = 0;
		this.name = name;

        this.plainText = plainText || '';
	}
}

export class Directory implements IStat {

	readonly type: FileType;
	readonly createTime: number;
	readonly modifyTime: number;
	readonly byteSize: number;

	readonly name: string;
	entries: Map<string, File | Directory>;

	constructor(name: string) {
		this.type = getFileType(name);
		this.createTime = Date.now();
		this.modifyTime = Date.now();
		this.byteSize = 0;
		this.name = name;
		
        this.entries = new Map();
	}
}