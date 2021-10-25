import { assert } from "console";
import { URI } from "src/base/common/file/uri";

function _testToString(testString: string, print?: boolean): void {
    
    const uri = URI.parse(testString);
    const toStr = uri.toString();

    if (print) {
        console.log(`original: ${testString}`);
        console.log(`toString(): ${toStr}`);
    }

    assert(toStr === testString);
}

function _testToFsPath(str: string, print?: boolean): void {
    const uri = URI.parse(str);
    const toFsPath = URI.toFsPath(uri);

    if (print) {
        console.log(`original: ${str}`);
        console.log(`toFsPath(): ${toFsPath}`);
    }
}

const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
const testStr2 = 'urn:example:animal:ferret:nose';
const testStr3 = 'file://D:/dev/MarkdownNote/src/code/common/service/test/file.test.txt';

_testToString(testStr1, true);
_testToString(testStr2, true);

_testToFsPath(testStr3, true);