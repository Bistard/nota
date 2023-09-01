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
    'rendererWorkbenchCommandRegister',
    (registrant) => {
        registrant.registerCommand(
            {
                id: WorkbenchCommands.toggleDevTool,
                description: 'Toggle the developer tool of the whole application.',
            },
            (provider) => {
                const hostService = provider.getOrCreateService(IHostService);
                hostService.toggleDevTools();
            },
        );
    
        registrant.registerCommand(
            {
                id: WorkbenchCommands.reloadWindow,
                description: 'Reload the current window entirely.',
            },
            (provider) => {
                const hostService = provider.getOrCreateService(IHostService);
                hostService.reloadWebPage();
            },
        );
    
        registrant.registerCommand(
            {
                id: WorkbenchCommands.closeApplication,
                description: 'Close the application.',
            },
            (provider) => {
                const lifecycleService = provider.getOrCreateService(ILifecycleService);
                lifecycleService.quit();
            },
        );
    },
);