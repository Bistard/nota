import { assert } from "console";
import { URI } from "src/base/common/file/uri";

function _testURI(testString: string, print?: boolean): void {
    
    const uri = URI.parse(testString);
    const tostr = uri.toString();

    if (print) {
        console.log(`origin: ${testString}`);
        console.log(`result: ${tostr}`);
    }

    assert(tostr === testString);
}

const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
const testStr2 = 'urn:example:animal:ferret:nose';

_testURI(testStr1, true);
_testURI(testStr2, true);
