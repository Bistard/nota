import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { DiskFileSystemProvider } from 'src/base/node/diskFileSystemProvider';
import { FileService } from 'src/code/common/service/fileService';

suite('fileService-test', () => {

    test('provider registration', async () => {
        // TODO
    });

    test('readFile', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        
        service.registerProvider('file', provider);
        const uri = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/temp/file.test-tiny.txt");
        const buffer = await service.readFile(uri);
        assert.strictEqual(buffer.toString(), 'Hello World');
    });

    test('writeFile', async () => {
        // const service = new FileService();
        // const provider = new DiskFileSystemProvider();
        
        // service.registerProvider('file', provider);
    });

});

// const service = new FileService();
// const diskFileSystemProvider = new DiskFileSystemProvider();
// service.registerProvider("file", diskFileSystemProvider);

// const uri1 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/temp/file.test-tiny.txt");
// service.readFile(uri1).then(buffer => {
//     console.log(buffer);
// });

// const uri2 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/temp/file.test-small.txt");
// service.readFile(uri2).then(buffer => {
//     console.log(buffer);
// });

// const uri3 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/temp/file.test-medium.txt");
// service.readFile(uri3).then(buffer => {
//     console.log(buffer);
// }); 

// const uri4 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/temp/mmc6.txt");
// service.readFile(uri4).then(buffer => {
//     console.log(buffer);
// }); 
