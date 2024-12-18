import { beforeEach, suite, test } from 'mocha';
import * as assert from 'assert';
import { RecentOpenUtility, IRecentOpenedTarget } from 'src/platform/app/common/recentOpen';
import { FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { IHostService } from 'src/platform/host/common/hostService';
import { StatusKey } from 'src/platform/status/common/status';
import { createNullHostService } from 'test/utils/testService';

suite('RecentOpenUtility', () => {

    let hostService!: IHostService;

    beforeEach(() => {
        hostService = createNullHostService();
        hostService.setApplicationStatus(StatusKey.OpenRecent, [
            '/path/to/file.txt|{"targetType":"file","pinned":true,"gotoLine":42}',
            '/path/to/directory|{"targetType":"directory","pinned":false}',
            '/path/to/file2.txt|{"targetType":"file","pinned":false,"gotoLine":24}',
            '/path/to/directory2|{"targetType":"directory","pinned":true}',
        ]);
    });

    test('getRecentOpened should return the most recent opened item', async () => {
        const result = await RecentOpenUtility.getRecentOpened(hostService);
        assert.ok(result);
        assert.strictEqual(URI.toString(result.target), 'file:///path/to/file.txt');
        assert.strictEqual(result?.targetType, FileType.FILE);
        assert.strictEqual(result?.pinned, true);
        assert.strictEqual(result?.gotoLine, 42);
    });

    test('getRecentOpenedDirectory should return the most recent opened directory', async () => {
        const result = await RecentOpenUtility.getRecentOpenedDirectory(hostService);
        assert.ok(result);
        assert.strictEqual(URI.toString(result.target), 'file:///path/to/directory');
        assert.strictEqual(result?.targetType, FileType.DIRECTORY);
        assert.strictEqual(result?.pinned, false);
    });

    test('getRecentOpenedFile should return the most recent opened file', async () => {
        const result = await RecentOpenUtility.getRecentOpenedFile(hostService);
        assert.ok(result);
        assert.strictEqual(URI.toString(result.target), 'file:///path/to/file.txt');
        assert.strictEqual(result?.targetType, FileType.FILE);
        assert.strictEqual(result?.pinned, true);
        assert.strictEqual(result?.gotoLine, 42);
    });

    test('getRecentOpenedAll should return all recent opened items', async () => {
        const result = await RecentOpenUtility.getRecentOpenedAll(hostService);
        assert.strictEqual(result.length, 4);
        assert.strictEqual(result[0]!.targetType, FileType.FILE);
        assert.strictEqual(result[1]!.targetType, FileType.DIRECTORY);
        assert.strictEqual(result[2]!.targetType, FileType.FILE);
        assert.strictEqual(result[3]!.targetType, FileType.DIRECTORY);
    });

    test('addToRecentOpened should add a new item and maintain uniqueness', async () => {
        const newTarget: IRecentOpenedTarget = {
            target: URI.fromFile('/path/to/new-file.txt'),
            targetType: FileType.FILE,
            pinned: false,
            gotoLine: 10,
        };
        assert.strictEqual(await RecentOpenUtility.addToRecentOpened(hostService, newTarget), true);
        assert.strictEqual((await RecentOpenUtility.getRecentOpenedAll(hostService)).length, 5);
        
        const result = await RecentOpenUtility.getRecentOpenedFile(hostService);
        assert.ok(result);
        assert.strictEqual(URI.toString(result.target), 'file:///path/to/new-file.txt');
        assert.strictEqual(result?.targetType, FileType.FILE);
        assert.strictEqual(result?.pinned, false);
        assert.strictEqual(result?.gotoLine, 10);
    });
    
    test('clearRecentOpened should clear the recent opened list', async () => {
        const result = await RecentOpenUtility.clearRecentOpened(hostService);
        assert.strictEqual(result, true);
        assert.strictEqual((await RecentOpenUtility.getRecentOpenedAll(hostService)).length, 0);
    });
    
    test('addToRecentOpened with invalid gotoLine', async () => {
        const newTarget: IRecentOpenedTarget = {
            target: URI.fromFile('/path/to/new-file.txt'),
            targetType: FileType.FILE,
            pinned: false,
            gotoLine: -10, // invalid
        };
        assert.strictEqual(await RecentOpenUtility.addToRecentOpened(hostService, newTarget), true);
        assert.strictEqual((await RecentOpenUtility.getRecentOpenedAll(hostService)).length, 5);
        
        const result = await RecentOpenUtility.getRecentOpenedFile(hostService);
        assert.ok(result);
        assert.strictEqual(URI.toString(result.target), 'file:///path/to/new-file.txt');
        assert.strictEqual(result?.targetType, FileType.FILE);
        assert.strictEqual(result?.pinned, false);
        assert.strictEqual(result?.gotoLine, undefined); // `undefined`
    });
});
