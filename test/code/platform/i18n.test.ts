import * as assert from 'assert';
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { i18n } from 'src/code/platform/i18n';

class i18nTest extends i18n {

    constructor(
        fileService: IFileService,
    ) {
        super({localeOpts: {}}, fileService);
    }

    public setModel(model: object): void {
        this._model = model as any;
    }

}

suite('i18n-test', () => {

    test('trans - no variables', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello Chris',
        });
        assert.strictEqual(i18n.trans('welcome'), 'hello Chris');
        assert.strictEqual(i18n.trans('welcome', {'name': 'Chris'}), 'hello Chris');

    });
    
    test('trans - single variable', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello {name}',
        });
        assert.strictEqual(i18n.trans('welcome', {'name': 'Chris'}), 'hello Chris');

        i18n.setModel({
            'welcome': '你好 {name}',
        });
        assert.strictEqual(i18n.trans('welcome', {'name': '克里斯'}), '你好 克里斯');

    });

    test('trans - more variables', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello {place}, my name is {name}.',
        });
        assert.strictEqual(i18n.trans('welcome', {'place': 'world', 'name': 'Chris'}), 'hello world, my name is Chris.');

        i18n.setModel({
            'welcome': '你好 {place}, 我的名字叫做 {name}.',
        });
        assert.strictEqual(i18n.trans('welcome', {'place': '世界', 'name': '克里斯'}), '你好 世界, 我的名字叫做 克里斯.');

        i18n.setModel({
            'welcome': '{greeting}, {singular} is {adjective}',
        });
        assert.strictEqual(i18n.trans('welcome', {'greeting': 'greetings', 'singular': 'programming', 'adjective': 'interesting'}), 'greetings, programming is interesting');

    });

    test('trans - no indices', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello Chris',
        });
        assert.strictEqual(i18n.trans('welcome'), 'hello Chris');
        assert.strictEqual(i18n.trans('welcome', ['Chris']), 'hello Chris');

    });

    test('trans - one index', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello {0}',
        });
        assert.strictEqual(i18n.trans('welcome', ['Chris']), 'hello Chris');

        i18n.setModel({
            'welcome': '你好 {0}',
        });
        assert.strictEqual(i18n.trans('welcome', ['克里斯']), '你好 克里斯');

    });

    test('trans - more indices', () => {

        const i18n = new i18nTest(new FileService());
        i18n.setModel({
            'welcome': 'hello {0}, my name is {1}.',
        });
        assert.strictEqual(i18n.trans('welcome', ['world', 'Chris']), 'hello world, my name is Chris.');

        i18n.setModel({
            'welcome': '你好 {0}, 我的名字叫做 {1}.',
        });
        assert.strictEqual(i18n.trans('welcome', ['世界', '克里斯']), '你好 世界, 我的名字叫做 克里斯.');

        i18n.setModel({
            'welcome': '{0}, {1} is {2}',
        });
        assert.strictEqual(i18n.trans('welcome', ['greetings', 'programming', 'interesting']), 'greetings, programming is interesting');

    });

});
