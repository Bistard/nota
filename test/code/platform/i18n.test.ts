import * as assert from 'assert';
import { Mutable } from 'src/base/common/util/type';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { i18n } from 'src/platform/i18n/common/i18n';
import { Section } from 'src/platform/section';
import { NullBrowserEnvironmentService, NullEnvironmentService, NullLogger } from 'test/utils/testService';

class i18nTest extends i18n {

    constructor(
        fileService: IFileService,
    ) {
        super({ localeOpts: {} }, fileService, new NullLogger(), new NullBrowserEnvironmentService());
    }

    public setModel(model: any): void {
        (<Mutable<any>>this._model) = model;
    }

}

suite('i18n-test', () => {

    test('trans - no variables', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello Chris',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome'), 'hello Chris');
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'name': 'Chris' }), 'hello Chris');

    });

    test('trans - single variable', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello {name}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'name': 'Chris' }), 'hello Chris');

        i18n.setModel({
            'section1': {
                'welcome': '你好 {name}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'name': '克里斯' }), '你好 克里斯');

    });

    test('trans - more variables', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello {place}, my name is {name}.',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'place': 'world', 'name': 'Chris' }), 'hello world, my name is Chris.');

        i18n.setModel({
            'section1': {
                'welcome': '你好 {place}, 我的名字叫做 {name}.',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'place': '世界', 'name': '克里斯' }), '你好 世界, 我的名字叫做 克里斯.');

        i18n.setModel({
            'section1': {
                'welcome': '{greeting}, {singular} is {adjective}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', { 'greeting': 'greetings', 'singular': 'programming', 'adjective': 'interesting' }), 'greetings, programming is interesting');

    });

    test('trans - no indices', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello Chris',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome'), 'hello Chris');
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['Chris']), 'hello Chris');

    });

    test('trans - one index', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello {0}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['Chris']), 'hello Chris');

        i18n.setModel({
            'section1': {
                'welcome': '你好 {0}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['克里斯']), '你好 克里斯');

    });

    test('trans - more indices', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello {0}, my name is {1}.',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['world', 'Chris']), 'hello world, my name is Chris.');

        i18n.setModel({
            'section1': {
                'welcome': '你好 {0}, 我的名字叫做 {1}.',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['世界', '克里斯']), '你好 世界, 我的名字叫做 克里斯.');

        i18n.setModel({
            'section1': {
                'welcome': '{0}, {1} is {2}',
            }
        });
        assert.strictEqual(i18n.trans('section1' as Section, 'welcome', ['greetings', 'programming', 'interesting']), 'greetings, programming is interesting');

    });

    test('trans - different sections', () => {

        const i18n = new i18nTest(new FileService(new NullLogger()));
        i18n.setModel({
            'section1': {
                'welcome': 'hello world.',
            },
            'section2': {
                'byebye': 'byebye world.',
            }
        });

        assert.strictEqual(i18n.trans('section1' as Section, 'welcome'), 'hello world.');
        assert.strictEqual(i18n.trans('section2' as Section, 'byebye'), 'byebye world.');

    });

});
