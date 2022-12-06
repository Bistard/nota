import { ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { IHostService } from "src/code/platform/host/common/hostService";
import { ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

const registrant = REGISTRANTS.get(ICommandRegistrant);

export const enum WorkbenchCommands {
    toggleDevTool = 'toggle-develop-tool',
    reloadWindow = 'reload-window',
    closeApplication = 'close-application',
}

export function workbenchCommandRegistrations(): void {
    
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
}