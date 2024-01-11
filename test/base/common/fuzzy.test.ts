import * as assert from 'assert';
import { IFilterOpts, isFiltered } from 'src/base/common/fuzzy';

suite('fuzzy-test', () => {

    suite('isFiltered', () => {

        test('should filter out string in exclude list only', () => {
            const filters: IFilterOpts = {
                include: [/foo/],
                exclude: [/bar/]
            };
            assert.strictEqual(isFiltered('bar', filters), true);
        });
    
        test('should not filter out string in include list only', () => {
            const filters: IFilterOpts = {
                include: [/foo/],
                exclude: [/bar/]
            };
            assert.strictEqual(isFiltered('foo', filters), false);
        });
    
        test('should not filter out string in both include and exclude lists', () => {
            const filters: IFilterOpts = {
                include: [/foo/],
                exclude: [/foo/]
            };
            assert.strictEqual(isFiltered('foo', filters), false);
        });
    
        test('should not filter out string not in either include or exclude lists', () => {
            const filters: IFilterOpts = {
                include: [/foo/],
                exclude: [/bar/]
            };
            assert.strictEqual(isFiltered('baz', filters), false);
        });
    });
});
