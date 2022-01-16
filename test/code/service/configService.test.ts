import * as assert from 'assert';
import { Emitter } from 'src/base/common/event';
import { ConfigModel, IConfigType } from "src/code/common/service/configService/configModel";
import { ConfigServiceBase, ConfigurationError } from "src/code/common/service/configService/configServiceBase";
import { FileService } from "src/code/common/service/fileService/fileService";

function createHuman(id: number = -1, name: string = 'unknown', male: boolean = false): ITestHumanSettings {
    return {
        id: id,
        name: name,
        male: male
    };
}

function createClass(): ITestClassSettings {
    return {
        students: [
            createHuman(2, 'cindy', false),
            createHuman(3, 'jody', true)
        ],
        roomNumber: 102,
        teacher: createHuman(1, 'chris', true)
    };
}

function assertHumans(human1: ITestHumanSettings, human2: ITestHumanSettings): void {
    assert.strictEqual(human1.id, human2.id);
    assert.strictEqual(human1.name, human2.name);
    assert.strictEqual(human1.male, human2.male);    
}

class EmptyConfigModel extends ConfigModel {
    constructor() { 
        super(
            {
                'human': createHuman(),
                'class': {
                    'computer': {
                        'science': {
                            students: [],
                            roomNumber: 101,
                            teacher: createHuman()
                        }
                    }
                }
            }
        );
    }
}

class EmptyConfigService extends ConfigServiceBase {
    
    private readonly _onDidChangeCustomConfig = this.__register( new Emitter<any>() );
    public readonly onDidChangeCustomConfig = this._onDidChangeCustomConfig.registerListener;

    constructor() {
        super(IConfigType.TEST, new EmptyConfigModel(), new FileService());
    }

    protected override __fireOnSpecificEvent(section: string, change: any): void {
        switch (section) 
        {
            case 'custom.test.section':
                this._onDidChangeCustomConfig.fire(change);
        }
    }

}

enum Section {
    human = 'human',
    class = 'class.computer.science'
}

interface ITestHumanSettings {
    id: number;
    name: string;
    male: boolean;
}

interface ITestClassSettings {
    students: ITestHumanSettings[];
    roomNumber: number;
    teacher: ITestHumanSettings;
}

suite('configService - test', () => {

    test('set / get', () => {
        const configService = new EmptyConfigService();

        const config1 = configService.get<ITestHumanSettings>(Section.human)!;
        assertHumans(config1, createHuman());

        configService.set(Section.human, createHuman(1, 'chris', true));
        
        const config2 = configService.get<ITestHumanSettings>(Section.human)!;
        assertHumans(config2, createHuman(1, 'chris', true));
    });

    test('set / get - longer section', () => {
        const configService = new EmptyConfigService();

        const config1 = configService.get<ITestClassSettings>(Section.class)!;
        assert.strictEqual(config1.roomNumber, 101);
        assert.strictEqual(config1.students.length, 0);
        assertHumans(config1.teacher, createHuman());
        
        configService.set(Section.class, createClass());

        const config2 = configService.get<ITestClassSettings>(Section.class)!;
        assert.strictEqual(config2.roomNumber, 102);
        assert.strictEqual(config2.students.length, 2);
        assertHumans(config2.students[0]!, createHuman(2, 'cindy', false));
        assertHumans(config2.students[1]!, createHuman(3, 'jody', true));
        assertHumans(config2.teacher, createHuman(1, 'chris', true));
    });

    test('set / get - unknown section', () => {
        const configService = new EmptyConfigService();

        configService.set('brand.new.section', { a: 1, b: '2', c: true });

        const newConfig = configService.get<any>('brand.new.section');
        assert.strictEqual(newConfig.a, 1);
        assert.strictEqual(newConfig.b, '2');
        assert.strictEqual(newConfig.c, true);

        try {
            configService.get<any>('unknown.section');
        } catch (err: any) {
            assert.strictEqual((err instanceof ConfigurationError), true);
        }
    });

    test('onDidChangeConfiguration event', () => {
        const configService = new EmptyConfigService();

        let type: IConfigType = IConfigType.GLOBAL;
        let changes: string[] = [];
        const listener = configService.onDidChangeConfiguration((e) => {
            type = e.type;
            changes = e.changes.sections;
        });

        configService.set(Section.human, createHuman(1, 'chris', true));
        assert.strictEqual(type, IConfigType.TEST);
        assert.strictEqual(changes[0]!, Section.human);

        configService.set(Section.class, createClass());
        assert.strictEqual(type, IConfigType.TEST);
        assert.strictEqual(changes[0]!, Section.class);

        listener.dispose();
        configService.set(Section.human, createHuman(1, 'chris', true));
        assert.strictEqual(type, IConfigType.TEST);
        assert.strictEqual(changes[0]!, Section.class);
    });

    test('customConfiguration event', () => {
        const configService = new EmptyConfigService();

        let newValue: any;
        const listener = configService.onDidChangeCustomConfig((e) => {
            newValue = e;
        });

        configService.set('custom.test.section', { a: 1, b: '2', c: true });
        assert.strictEqual(newValue.a, { a: 1, b: '2', c: true }.a);
        assert.strictEqual(newValue.b, { a: 1, b: '2', c: true }.b);
        assert.strictEqual(newValue.c, { a: 1, b: '2', c: true }.c);
    });

});