import { AllCommands } from "src/workbench/services/workbench/commandList";
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
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.toggleDevTools();
                },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.reloadWindow,
                command: (provider) => {
                    const hostService = provider.getOrCreateService(IHostService);
                    hostService.reloadWebPage();
                },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.closeApplication,
                command: (provider) => {
                    const lifecycleService = provider.getOrCreateService(ILifecycleService);
                    lifecycleService.quit();
                },
            },
        );
    },
);