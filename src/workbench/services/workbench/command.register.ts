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

        // Test code for `notificationServeice`, should be removed when done
        registrant.registerCommand(
            {
                id: WorkbenchCommands.openNotification,
                description: 'Open notification on bottom-right',
            },
            (provider) => {
                // Showing the notification module on bottom-right
                const notificationService = provider.getOrCreateService(INotificationService);
                notificationService.notify({
                    title: 'Sample Notification',
                    message: 'This is a sample notification message.',
                    actions: [
                        // {
                        //     label: 'Close',
                        //     backgroundColor: '#107c10', // Green background for the "Close" button
                        //     textColor: '#FFFFFF', // White text color for the "Close" button
                        //     callback: () => {
                        //         // Logic to close the notification
                        //     }
                        // },
                        {
                            label: 'Learn more',
                            backgroundColor: 'rgb(199, 58, 73)', // Blue background for the "Learn more" button
                            textColor: '#FFFFFF', // White text color for the "Learn more" button
                            callback: () => {
                                // Logic to handle "Learn more" action
                            }
                        }
                        // ... other actions ...
                    ]
                });
                notificationService.notify({
                    message: 'Your notes will no longer sync and may be lost. Upgrade your iCloud storage or turn iCloud sync off in Nota settings.',
                    // actions: [
                    //     {
                    //         label: 'Close',
                    //         callback: () => {
                    //             // Logic to close the notification
                    //         }
                    //     },
                    //     // ... other actions ...
                    // ]
                });
            },
        );
    },
);