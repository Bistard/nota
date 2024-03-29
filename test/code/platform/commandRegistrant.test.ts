import * as assert from 'assert';
import { before } from 'mocha';
import { CommandRegistrant, ICommandExecutor } from 'src/platform/command/common/commandRegistrant';
import { CommandService, ICommandService } from 'src/platform/command/common/commandService';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IInstantiationService, InstantiationService, IServiceProvider } from 'src/platform/instantiation/common/instantiation';
import { IRegistrantService, RegistrantService } from 'src/platform/registrant/common/registrantService';
import { NullLogger } from 'test/utils/testService';

interface ITestService extends IService {
    num: number;

    foo(arg: number): number;
}

class TestService implements ITestService {

    declare _serviceMarker: undefined;
    public num = 1;

    public foo(arg: number): number {
        this.num = arg;
        return arg;
    }
}

const ITestService = createService<ITestService>('test-service');

suite('commandRegistrant-test', () => {

    let instantiationService: IInstantiationService;
    const id = 'test';
    const executor: ICommandExecutor = (provider: IServiceProvider, num: number): number => {
        const testService = provider.getOrCreateService(ITestService);
        return testService.foo(num);
    };

    let commandRegistrant: CommandRegistrant;

    before(() => {
        instantiationService = new InstantiationService();
        instantiationService.register(IInstantiationService, instantiationService);

        const testService = new TestService();
        instantiationService.register(ITestService, testService);
        
        const registrantService = new RegistrantService(new NullLogger());
        instantiationService.register(IRegistrantService, registrantService);
        commandRegistrant = new CommandRegistrant();
        registrantService.registerRegistrant(commandRegistrant);

        const commandService = new CommandService(instantiationService, new NullLogger(), registrantService);
        instantiationService.register(ICommandService, commandService);
    });

    test('register-command', () => {
        commandRegistrant.registerCommand({ id }, executor);

        const command = commandRegistrant.getCommand(id);
        assert.deepStrictEqual(command, {
            id: id,
            command: executor,
            description: 'No descriptions are provided.',
        });
    });

    test('execute-command', async () => {
        const commandService = instantiationService.getService(ICommandService);
        const testService = instantiationService.getService(ITestService);
        const result = await commandService.executeCommand<number>(id, 100);
        assert.strictEqual(100, testService.num);
        assert.strictEqual(100, result);
    });

});