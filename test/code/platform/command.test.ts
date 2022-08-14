import * as assert from 'assert';
import { NullLogger } from 'src/base/common/logger';
import { CommandRegistrant, ICommandExecutor } from 'src/code/platform/command/common/command';
import { CommandService, ICommandService } from 'src/code/platform/command/common/commandService';
import { IFileService } from 'src/code/platform/files/common/fileService';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { IInstantiationService, InstantiationService, IServiceProvider } from 'src/code/platform/instantiation/common/instantiation';

interface ITestService {
    num: number;

    foo(arg: number): void;
}

class TestService implements ITestService {

    public num = 1;
    
    public foo(arg: number) {
        this.num = arg;
    }
}

const ITestService = createDecorator<ITestService>('test-service');

suite('command-test', () => {
    
    let instantiationService: IInstantiationService;
    const id = 'test';
    const executor: ICommandExecutor = (provider: IServiceProvider, num: number): void => {
        const testService = provider.getOrCreateService(ITestService);
        testService.foo(num);
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

    test('execute-command', () => {
        const commandService = instantiationService.getService(ICommandService);
        const testService = instantiationService.getService(ITestService);
        commandService.executeCommand(id, 100); 
        assert.strictEqual(100, testService.num);
    })
    
});