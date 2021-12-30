import * as assert from 'assert';
import { ConfigModel, IConfigType } from "src/code/common/service/configService/configModel";
import { ConfigServiceBase } from "src/code/common/service/configService/configService";
import { FileService } from "src/code/common/service/fileService";

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
    
    constructor() {
        super(IConfigType.TEST, new EmptyConfigModel(), new FileService());
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

    test('onDidChangeConfiguration event', () => {
        const configService = new EmptyConfigService();

        let type: IConfigType = IConfigType.GLOBAL;
        let changes: string[] = [];
        const listener = configService.onDidChangeConfiguration((e) => {
            type = e.type;
            changes = e.changes.keys;
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

});