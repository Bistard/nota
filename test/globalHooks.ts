import * as fs from 'fs';
import * as os from 'os';
import { after } from "mocha";
import { TestPath } from "test/utils/testService";
import { fileExists } from "src/base/node/io";
import { ASNIForegroundColor, setANSIColor } from 'src/base/common/color';

/**
 * The file will be attached before mocha runs the unit tests.
 */

(() => {
    console.log(setANSIColor(`[Global Hooks]`, { fgColor: ASNIForegroundColor.Green }), `Global hooks are attached on the environment '${os.platform()}'`);

    /**
     * cleanup after all the unit tests are finished.
     */
    after(async () => {
        console.log(setANSIColor(`[Global Hooks] cleanning up unit test resources...`, {}));

        await cleanTestDirectory();

        console.log(setANSIColor(`[Global Hooks]`, { fgColor: ASNIForegroundColor.Green }), `cleanning finished`);
    });
})();

async function cleanTestDirectory() {
    if (fileExists(TestPath)) {
        await fs.promises.rm(TestPath, { maxRetries: 3, retryDelay: 100, force: true, recursive: true });
    }
}
