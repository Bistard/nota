import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { FileCommands } from "src/workbench/services/fileTree/fileCommands";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { errorToMessage } from "src/base/common/utilities/panic";

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

    public override run(provider: IServiceProvider, error: any): boolean {
        const notificationService = provider.getOrCreateService(INotificationService);

        let message: string;
        if (error === 'string') {
            message = error;
        } else {
            message = errorToMessage(error.message ?? error, false);
        }
        notificationService.error(message);
        return true;
    }
}