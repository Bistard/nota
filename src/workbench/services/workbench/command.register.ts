import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { FileCommands } from "src/workbench/services/fileTree/fileCommands";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { INotificationService, NotificationTypes } from "src/workbench/services/notification/notificationService";
import { errorToMessage } from "src/base/common/utilities/panic";
import { ILogService } from "src/base/common/logger";
import { Icons } from "src/base/browser/icon/icons";

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

        registrant.registerCommandBasic({
            id: AllCommands.popNotification,
            command: (provider) => {
                const notificationService = provider.getOrCreateService(INotificationService);
                notificationService.notify({
                    message: 'This is another long sample notification message. Testing code~',
                    subMessage: 'Source: file:///Users/asteria_zhaimu/Desktop/GitHub/nota/.wisp/app.config.json',
                    type: NotificationTypes.Info,
                    actions: [
                        {
                            label: 'Close',
                            run: 'noop',
                        },
                    ]
                });
                notificationService.notify({
                    message: 'This is a  sample notification message without specifying submessage.',
                    type: NotificationTypes.Info,
                    actions: [
                        {
                            label: 'Close',
                            run: 'noop',
                        },
                    ]
                });
                notificationService.notify({
                    message: 'This is a warning message.',
                    type: NotificationTypes.Warning,
                    actions: [
                        {
                            label: 'Close',
                            run: 'noop',
                        },
                    ]
                });
                notificationService.notify({
                    message: 'This is a very very very very very very very very very very very very very very very very very very very very long  ERROR message!',
                    subMessage: 'Resource file: file:///Users/asteria_zhaimu/Desktop/砂浜/NOTA软件开发/',
                    type: NotificationTypes.Error,
                    actions: [
                        {
                            label: 'Close',
                            run: 'noop',
                        },
                        {
                            label: 'Yes',
                            run: 'noop',
                        },
                    ]
                });
            }
        });

        registrant.registerCommand(new AlertError());
        registrant.registerCommand(new FileCommands.FilePaste());
    },
);

class AlertError extends Command {

    constructor() {
        super({
            id: AllCommands.alertError,
            when: null,
        });
    }

    public override run(provider: IServiceProvider, reporter: string, error: any): boolean {
        const notificationService = provider.getOrCreateService(INotificationService);
        const logService = provider.getOrCreateService(ILogService);

        let message: string;
        if (typeof error === 'string') {
            message = error;
        } else {
            message = errorToMessage(error.message ?? error, false);
        }

        logService.error(reporter, message, error);
        notificationService.error(message, { actions: [{ label: 'Close', run: 'noop' }] });

        return true;
    }
}