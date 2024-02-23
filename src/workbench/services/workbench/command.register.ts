import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const enum WorkbenchCommands {
    toggleDevTool = 'toggle-develop-tool',
    reloadWindow = 'reload-window',
    closeApplication = 'close-application',
}

export const rendererWorkbenchCommandRegister = createRegister(
    RegistrantType.Command, 
    'rendererWorkbench',
    (registrant) => {
        registrant.registerCommandSchema(
            {
                id: WorkbenchCommands.toggleDevTool,
                description: 'Toggle the developer tool of the whole application.',
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.toggleDevTools();
                },
            },
        );
    
        registrant.registerCommandSchema(
            {
                id: WorkbenchCommands.reloadWindow,
                description: 'Reload the current window entirely.',
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.reloadWebPage();
                },
            },
        );
    
        registrant.registerCommandSchema(
            {
                id: WorkbenchCommands.closeApplication,
                description: 'Close the application.',
                command: (provider) => {
                    const lifecycleService = provider.getOrCreateService(ILifecycleService);
                    lifecycleService.quit();
                },
            },
        );
    },
);