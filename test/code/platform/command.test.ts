import * as assert from 'assert';
import { NullLogger } from 'src/base/common/logger';
import { CommandRegistrant, ICommandExecutor } from 'src/code/platform/command/common/command';
import { CommandService, ICommandService } from 'src/code/platform/command/common/commandService';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { IInstantiationService, InstantiationService, IServiceProvider } from 'src/code/platform/instantiation/common/instantiation';

interface ITestService {
    num: number;

    foo(arg: number): number;
}

class TestService implements ITestService {

    public num = 1;
    
    public foo(arg: number): number {
        this.num = arg;
        return arg;
    }
}

const ITestService = createDecorator<ITestService>('test-service');

suite('command-test', () => {
    
    let instantiationService: IInstantiationService;
    const id = 'test';
    const executor: ICommandExecutor = (provider: IServiceProvider, num: number): number => {
        const testService = provider.getOrCreateService(ITestService);
        return testService.foo(num);
    } 


    setup(() => {
        instantiationService = new InstantiationService();
        const testService = new TestService();
        const commandService = new CommandService(instantiationService, new NullLogger());
        instantiationService.register(ITestService, testService);
        instantiationService.register(ICommandService, commandService);
    });

    test('register-command', () => {
        CommandRegistrant.registerCommand(id, executor);

        const command = CommandRegistrant.getCommand(id);
        assert.deepStrictEqual(command, {
            id: id, 
            executor: executor,
            description: 'No descriptions',
        });
    });

    test('execute-command', async () => {
        const commandService = instantiationService.getService(ICommandService);
        const testService = instantiationService.getService(ITestService);
        const result = await commandService.executeCommand<number>(id, 100); 
        assert.strictEqual(100, testService.num);
        assert.strictEqual(100, result);
    })
    
});