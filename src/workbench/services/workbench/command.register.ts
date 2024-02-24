import { AllCommands } from "src/platform/command/common/commandList";
import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const rendererWorkbenchCommandRegister = createRegister(
    RegistrantType.Command, 
    'rendererWorkbench',
    (registrant) => {
        registrant.registerCommandBasic(
            {
                id: AllCommands.toggleDevTool,
                description: 'Toggle the developer tool of the whole application.',
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.toggleDevTools();
                },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.reloadWindow,
                description: 'Reload the current window entirely.',
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.reloadWebPage();
                },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.closeApplication,
                description: 'Close the application.',
                command: (provider) => {
                    const lifecycleService = provider.getOrCreateService(ILifecycleService);
                    lifecycleService.quit();
                },
            },
        );
    },
);