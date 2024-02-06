import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { INotificationService } from "../notification/notificationService";

export const enum WorkbenchCommands {
    toggleDevTool = 'toggle-develop-tool',
    reloadWindow = 'reload-window',
    closeApplication = 'close-application',
    openNotification = "openNotification"
}

export const rendererWorkbenchCommandRegister = createRegister(
    RegistrantType.Command, 
    'rendererWorkbench',
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

        registrant.registerCommand(
            {
                id: WorkbenchCommands.openNotification,
                description: 'Open notification on bottom-right',
            },
            (provider) => {
                // Showing the notification module on bottom-right
                const notificationService = provider.getOrCreateService(INotificationService);
                notificationService.notify({
                    message: 'This is a sample notification message.',
                    actions: [
                        {
                            label: 'Close',
                            callback: () => {
                                // Logic to close the notification
                            }
                        },
                        // ... other actions ...
                    ]
                });
                notificationService.notify({
                    message: 'This is another long sample notification message. Testing code~',
                    actions: [
                        {
                            label: 'Close',
                            callback: () => {
                                // Logic to close the notification
                            }
                        },
                        // ... other actions ...
                    ]
                });
            },
        );
    },
);