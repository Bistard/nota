import { URI } from "src/base/common/file/uri";
import { DiskFileSystemProvider } from "src/base/node/diskFileSystemProvider";
import { FileService } from "src/code/common/service/fileService";

const fileService = new FileService();
const diskFileSystemProvider = new DiskFileSystemProvider();
fileService.registerProvider("file", diskFileSystemProvider);

const uri1 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/file.test-tiny.txt");
fileService.readFile(uri1).then(dataBuffer => {
    console.log(dataBuffer);
});

const uri2 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/file.test-small.txt");
fileService.readFile(uri2).then(dataBuffer => {
    console.log(dataBuffer);
});

const uri3 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/file.test-medium.txt");
fileService.readFile(uri3).then(dataBuffer => {
    console.log(dataBuffer);
}); 

const uri4 = URI.parse("file://D:/dev/MarkdownNote/src/code/common/service/test/mmc6.txt");
fileService.readFile(uri4).then(dataBuffer => {
    console.log(dataBuffer);
}); 